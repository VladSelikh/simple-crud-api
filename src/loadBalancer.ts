import * as dotenv from 'dotenv';
import cluster, { Worker } from 'cluster';
import * as http from 'http';
import os from 'os';
import { HTTP_METHODS } from './constants/constants';
import { app as ServerApp } from './server';
import { parseBody } from './utils/helpers';

dotenv.config({ path: __dirname + '/.env'})

const PORT: number = parseInt(process.env.PORT!) || 4000;

if (cluster.isPrimary) {
    let currentServer: number = 0;
    const workers: Worker[] = [];
    const servers: string[] = [];
    const ports: number[] = [];

    const streamsNumber = os.availableParallelism() - 1;
    for (let i = 1; i < streamsNumber + 1; i++) {
        servers.push(`http://localhost:${PORT + i}`)
        ports.push(PORT + i)
    }


    for (let i = 0; i < streamsNumber; i++) {
        const worker = cluster.fork();
        workers.push(worker);
    }

    workers.forEach((w) => {
        w.on('message', (data: string) => {
            const workerData = JSON.parse(data);
            if (workerData.action === 'set') {
                workers.forEach(w => w.send(JSON.stringify({ users: workerData.value })));
            }
        })
    })

    const masterServer = http.createServer(async (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');

        const body = req.method === HTTP_METHODS.POST || req.method === HTTP_METHODS.PUT ? await parseBody(req) : {};
        const requestData = JSON.stringify(body);

        currentServer === (servers.length - 1) ? currentServer = 0 : currentServer++;

        const destination = `${servers[currentServer]}${req.url}`

        process.stdout.write(`\nSending request to [${req.method}] ${destination}\n`)

        const options = {
            hostname: '127.0.0.1',
            port: ports[currentServer],
            path: req.url,
            method: req.method,
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(requestData),
            },
        };

        const request = http.request(options, async (response: any) => {
            response.setEncoding('utf8');
            res.statusCode = response.statusCode;
            if (response.statusCode == 204) {
                res.end()
            }
            response.on('data', (chunk: any) => {
              res.end(chunk);
            });
        });

        if (req.method !== HTTP_METHODS.GET) {
            request.write(requestData);
        }

        request.end();
    });

    masterServer.listen(PORT, '127.0.0.1', () => {
        console.log(`\nMaster pid: ${process.pid} started on port ${PORT}`);
    })
} else {
    const workerId: number = (cluster.worker as Worker).id;
    const CHILD_PORT: number = PORT + workerId;
    const app: http.Server = ServerApp();
    app.listen(CHILD_PORT, '127.0.0.1', () => {
        console.log(`\nServer pid: ${process.pid} started on port ${CHILD_PORT}`);
    })
}
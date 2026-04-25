import appPromise from "./app";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import type { IncomingMessage, ServerResponse } from "http";

const httpPort  = process.env.PORT       || 3000;
const httpsPort = process.env.HTTPS_PORT || 443;
const httpsEnabled = process.env.HTTPS_ENABLED === "true";
const keyPath  = process.env.SSL_KEY_PATH;
const certPath = process.env.SSL_CERT_PATH;

const isHttpsConfigValid = (): boolean => {
    if (!httpsEnabled) return false;
    if (!keyPath || !certPath) {
        console.error("HTTPS is enabled but SSL_KEY_PATH / SSL_CERT_PATH are not set.");
        return false;
    }
    if (!fs.existsSync(path.resolve(keyPath)) || !fs.existsSync(path.resolve(certPath))) {
        console.error("HTTPS is enabled but SSL key/cert file was not found.");
        return false;
    }
    return true;
};

appPromise.then((app) => {
    if (isHttpsConfigValid() && keyPath && certPath) {
        // HTTPS server on HTTPS_PORT
        const httpsServer = https.createServer(
            {
                key:  fs.readFileSync(path.resolve(keyPath)),
                cert: fs.readFileSync(path.resolve(certPath)),
            },
            app
        );
        httpsServer.listen(httpsPort, () => {
            console.log(`HTTPS server is running on https://localhost:${httpsPort}`);
        });

        // HTTP server on PORT — redirects all traffic to HTTPS
        const redirectApp = http.createServer((_req: IncomingMessage, res: ServerResponse) => {
            const host = (_req.headers.host ?? "localhost").split(":")[0];
            res.writeHead(301, { Location: `https://${host}:${httpsPort}${_req.url}` });
            res.end();
        });
        redirectApp.listen(httpPort, () => {
            console.log(`HTTP  server is running on http://localhost:${httpPort}  (redirects to HTTPS)`);
        });
        return;
    }

    // HTTPS not configured — plain HTTP
    const httpServer = http.createServer(app);
    httpServer.listen(httpPort, () => {
        console.log(`HTTP server is running on http://localhost:${httpPort}`);
    });
});

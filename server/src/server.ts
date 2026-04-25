import appPromise from "./app";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";

const httpPort  = process.env.PORT       || 3000;
const httpsPort = process.env.HTTPS_PORT || 443;
const keyPath  = process.env.SSL_KEY_PATH;
const certPath = process.env.SSL_CERT_PATH;
const isProduction = process.env.NODE_ENV === "production";

appPromise.then((app) => {
    console.log(`NODE_ENV: ${process.env.NODE_ENV ?? "development"}`);

    if (isProduction) {
        if (!keyPath || !certPath) {
            console.error("Production mode requires SSL_KEY_PATH and SSL_CERT_PATH.");
            process.exit(1);
        }

        const resolvedKeyPath = path.resolve(keyPath);
        const resolvedCertPath = path.resolve(certPath);
        if (!fs.existsSync(resolvedKeyPath) || !fs.existsSync(resolvedCertPath)) {
            console.error("Production mode requires valid SSL key/cert files.");
            process.exit(1);
        }

        const httpsServer = https.createServer(
            {
                key: fs.readFileSync(resolvedKeyPath),
                cert: fs.readFileSync(resolvedCertPath),
            },
            app
        );
        httpsServer.listen(httpsPort, () => {
            console.log(`HTTPS server is running on https://localhost:${httpsPort}`);
        });
        return;
    }

    const httpServer = http.createServer(app);
    httpServer.listen(httpPort, () => {
        console.log(`HTTP server is running on http://localhost:${httpPort}`);
    });
});

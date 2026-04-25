import appPromise from "./app";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";

const port = process.env.PORT || 3000;
const httpsEnabled = process.env.HTTPS_ENABLED === "true";
const keyPath = process.env.SSL_KEY_PATH;
const certPath = process.env.SSL_CERT_PATH;

const isHttpsConfigValid = () => {
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
        const httpsServer = https.createServer(
            {
                key: fs.readFileSync(path.resolve(keyPath)),
                cert: fs.readFileSync(path.resolve(certPath)),
            },
            app
        );

        httpsServer.listen(port, () => {
            console.log(`HTTPS server is running on https://localhost:${port}`);
        });
        return;
    }

    const httpServer = http.createServer(app);
    httpServer.listen(port, () => {
        console.log(`HTTP server is running on http://localhost:${port}`);
    });
});

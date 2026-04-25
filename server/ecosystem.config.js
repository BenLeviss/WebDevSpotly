module.exports = {
    apps: [
        {
            name: 'spotly-server',
            script: './dist/server.js',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};

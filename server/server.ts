import appPromise from "./app";

const port = process.env.PORT || 3000;

appPromise.then((app) => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});

import express from 'express';
import bodyParser from 'body-parser';
import swapRouter from './routes/swap'

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/ping', (_req, res) => {
    console.log('ping ' + new Date().toLocaleDateString())
    console.log(process.env.RPC_URL)
    res.send('pong')
})

app.use('/swap', swapRouter)

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})
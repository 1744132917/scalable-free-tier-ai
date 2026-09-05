import express from 'express';

const app = express();
app.use(express.json());

app.post('/pubsub', (req, res) => {
  const msg = req.body?.message?.data;
  const decoded = msg ? Buffer.from(msg, 'base64').toString('utf8') : '';
  console.log(JSON.stringify({ level: 'info', msg: 'pubsub payload', decoded }));
  res.status(204).send();
});

app.listen(process.env.PORT || 8080, () => {
  console.log('cloud-run worker started');
});

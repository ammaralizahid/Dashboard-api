const express = require('express')
const app =express();
const routes=require('./Routes/routes.js')
const errorObject=require('./Utilities/errorObject.js')
require('dotenv').config()
app.use(express.json());

app.use('/api',routes)

app.use('/',(req, res) => {
    res.status(200).send("Node Js Working.")
})

app.use((req, res, next) => {
    const err = new Error("Not found");
    err.status = 404;
    next(err);
  });
app.use((err, req, res, next) => {
  console.log("=====ERROR:",err.message !== undefined ? err.message : "");
  const errArray=[200,201,204,400,401,403,404,500,502,409]
  const error = errorObject.find((e) => e.status === err);
    return res.status(errArray.includes(err.status) ? err.status : errArray.includes(err) ? err : 500).send({
      error: {
        status: err.status ? err.status : err || 500,
        message: error ? error.message : err.message.length > 0 ? err.message : "Something went wrong",
      },
    });
  }); 
app.listen(9001,(err)=>{
if(err){
    console.log("Server Crashed: " + err);
}else{
    console.log("Server is listening on 9001");
}
})
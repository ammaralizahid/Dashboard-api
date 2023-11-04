const jwt = require("jsonwebtoken");

const createToken=async(userID,expiresIn,IPAddress,role)=>{
    return new Promise((resolve,reject)=>{
        const payload = {
            id: userID,
            iss : "FindNow.pro",
            aud : ["Service Providers"],
            IPAddress:IPAddress ? IPAddress : "127.0.0.1",
            role:role ? role : "Anonymous"
          };
        jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: expiresIn},(err,result)=>{
            if(err){
                reject(err)
            }else{
                resolve(result)
            }
        });
    })
  }

  const verifyToken=(token)=>{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  }
module.exports = {
    createToken
};  
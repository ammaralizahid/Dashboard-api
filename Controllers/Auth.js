const Auth=require('../Models/Auth.js')
const dsl=require('../Utilities/dsl.json')
const { createToken } = require('../Utilities/jwt.js')
const { sendEmail } = require('../Utilities/Notifications.js')
const Cryptr = require('cryptr');
const cryptr = new Cryptr(`${process.env.CRYPTR_SECRET}`);

        const request= async(req,res,next)=>{
            try {
                
                let {request,userId} = req.params
                let {data,table} = req.body
                const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
                const numberRegex = /^(\\+92|0)?-?3\d{2}-?\d{7}$/;
                const login=request.toLowerCase().includes('login') || request.toLowerCase().includes('sign-in')
                const register=request.toLowerCase().includes('register') || request.toLowerCase().includes('sign-up')
                const forgetPassword=request.toLowerCase().includes('forget-password') || request.toLowerCase().includes('forget-pass') ||
                request.toLowerCase().includes('forgetPassword') || request.toLowerCase().includes('forget-password-request')
                const auth=new Auth()
                const timestamp = new Date().getTime(); // get the current Unix timestamp in milliseconds
                const randomSuffix = Math.floor(Math.random() * 1000000);
                const randomNumber=Number(timestamp)+Number(randomSuffix)
                data["uuid"]=randomNumber.toString().slice(-6)
                data[`${table}_is_active`]=auth.active
                data[`${table}_created_at`]=auth.created_at
                let response= await auth.request(data,table,request,userId)
                if(register){
                    if(response){
                    if(req.body.setPassword === true){
                        const password=response.insertId+''+data.uuid
                        const passResponse= await auth.setPassword(password,response.insertId,table)
                        if(passResponse){
                            const email=emailRegex.test(`${data[`${table}_email`]}`) ? await sendEmail(undefined,`${data[`${table}_email`]}`,undefined,"FindNow Account Password",password) : ""
                            if(email){                            
                                res.status(200).send({data:response,emailResponse:"Password Sent To Registered Email",userMessage:"Password Sent To Registered Email", dsl:dsl.clientSide})
                            }else{
                                res.status(400).send({data:response,emailResponse:"Email Not Sent"})
                            }                        
                        }
                    }else if(req.body.passwordThroughEmail === true){            
                        const token=await createToken(response.insertId,"30m",req.ip,undefined)
                        if(token){
                            var encryptedString = cryptr.encrypt(`${token}`);
                        }
                        const link = `${process.env.FINDNOW_BASE_URL}/${request}/${encryptedString}`;
                        const targetUser=`${data[`${table}_email`]}` || data.number || data.uuid
                        const validate= emailRegex.test(targetUser) ? await sendEmail(undefined,`${data[`${table}_email`]}` ? `${data[`${table}_email`]}`: data.number? data.number : data.uuid && data.uuid,undefined,"FindNow Account Password",link) 
                        : numberRegex.test(targetUser) ? await sendOTP() : false  
                        if(validate){                            
                            res.status(200).send({data:{link},emailResponse:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Sent" : numberRegex.test(data.number) && "Message Sent"
                             ,userMessage:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Sent To You" : numberRegex.test(data.number) && "Message Sent To Your Number",dsl:dsl.clientSide})
                        }else{
                            res.status(400).send({data:{},emailResponse:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Not Sent" : numberRegex.test(data.number) && "Message Not Sent"})
                        }
                    }
                            }
                }else if(login){
                    let {password,...rest}=response[0]
                    res.status(200).send({data:rest, dsl:dsl.clientSide})
                }else if(forgetPassword){
                    if(response){
                        const token=await createToken(response[0]?.id,"30m",req.ip,undefined)
                        if(token){
                            var encryptedString = cryptr.encrypt(`${token}`);
                        }
                        const link = `${process.env.FINDNOW_BASE_URL}/${request}/${encryptedString}`;
                        const targetUser=`${data[`${table}_email`]}` || data.number || data.uuid
                        const validate= emailRegex.test(targetUser) ? await sendEmail(undefined,`${data[`${table}_email`]}` ? `${data[`${table}_email`]}`: data.number? data.number : data.uuid && data.uuid,undefined,"FindNow Account Password",link) 
                        : numberRegex.test(targetUser) ? await sendOTP() : false
                        if(validate){                            
                            res.status(200).send({data:{link},emailResponse:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Sent" : numberRegex.test(data.number) && "Message Sent"
                             ,userMessage:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Sent To You" : numberRegex.test(data.number) && "Message Sent To Your Number"})
                        }else{
                            res.status(400).send({data:{},emailResponse:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Not Sent" : numberRegex.test(data.number) && "Message Not Sent"})
                        }
                    }
                  }
            } catch (error) {
                next(error)
            }
        }
        const register=(req,res,next)=>{
        console.log("inside register method");
        }

module.exports ={
    request,
    register
}
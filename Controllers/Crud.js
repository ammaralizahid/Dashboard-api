const Crud=require('../Models/Crud.js')
const dsl=require('../Utilities/dsl.json')
const { sendEmail } = require('../Utilities/Notifications.js')
const { createToken } = require('../Utilities/jwt.js')
const Cryptr = require('cryptr');
const cryptr = new Cryptr(`${process.env.CRYPTR_SECRET}`);

    const  create=async(req,res,next)=>{
    try {

        let {table,userId}=req.params
        let {filter,filterValue}=req.query
        let {request,data}=req.body
        const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
        const numberRegex = /^(\\+92|0)?-?3\d{2}-?\d{7}$/;
        const resetPassword=request ? (request.toLowerCase().includes('reset-password') || 
        request.toLowerCase().includes('password-reset') || request.toLowerCase().includes('reset-password-request') ||
        request.toLowerCase().includes('set-password') || request.toLowerCase().includes('setPassword')):""
        const crud=new Crud()
        let response =await crud.create(table,data,request,userId,filter,filterValue)
        if(response){   
                if(resetPassword){
                const targetUser=`${data[`${table}_email`]}` || data.number || data.uuid
                const validate= emailRegex.test(targetUser) ? await sendEmail(undefined,`${data[`${table}_email`]}` ? `${data[`${table}_email`]}`: data.number? data.number : data.uuid && data.uuid,undefined,"FindNow Account Password",undefined) 
                : numberRegex.test(targetUser) ? await sendOTP() : false  
                if(validate){                            
                    res.status(200).send({data:{},emailResponse:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Sent" : numberRegex.test(data.number) && "Message Sent"
                     ,userMessage:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Sent To You" : numberRegex.test(data.number) && "Message Sent To Your Number"})
                }else{
                    res.status(400).send({data:{},emailResponse:emailRegex.test(`${data[`${table}_email`]}`) ? "Email Not Sent" : numberRegex.test(data.number) && "Message Not Sent"})
                }                   
            }else{
                res.status(200).send({data:{response},userMessage:dsl.adminSide.upsertActions.addProducts.userMessage})
            }
            }              
    } 
    catch (error) {
        next(error)
    }
    }
    const  get=async(req,res,next)=>{

    try {
        let {table,id}=req.params
        let {join,associatedTables,filter,filterValue,filterData,page,limit}=req.query
        const crud=new Crud()
        let data =await crud.get(table,id,join,associatedTables,filter,filterValue,filterData,page-1,limit)
        if(data){
             res.status(200).send(data)
        }        

    } 
    catch (error) {
        next(error)
    }

    }

module.exports={
    create,
    get
}
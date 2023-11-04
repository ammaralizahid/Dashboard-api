const db=require('../Utilities/config')
const dsl=require('../Utilities/dsl.json')
const bcrypt = require('bcrypt');

class Auth{
    constructor(){
        this.active=true,
        this.created_at=new Date()
    }
    request= async(data,table,request,userId)=>{
        return new Promise(async(resolve,reject)=>{
            const login=request.toLowerCase().includes('login') || request.toLowerCase().includes('sign-in')
            const register=request.toLowerCase().includes('register') || request.toLowerCase().includes('sign-up')
            const resetPassword=request.toLowerCase().includes('reset-password') || 
            request.toLowerCase().includes('password-reset') || request.toLowerCase().includes('reset-password-request')
            || request.toLowerCase().includes('password-reset-request')
            || request.toLowerCase().includes('signup')
            || request.toLowerCase().includes('signin')
            const forgetPassword=request.toLowerCase().includes('forget-password') || request.toLowerCase().includes('forget-pass') ||
            request.toLowerCase().includes('forgetPassword') || request.toLowerCase().includes('forget-password-request')
            if (login || forgetPassword) {
                const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
                const numberRegex = /^(\\+92|0)?-?3\d{2}-?\d{7}$/;
                const uuidRegex = /^\d+$/;
                let columnToCheck
                if(data.hasOwnProperty("email") || data.hasOwnProperty("number") || data.hasOwnProperty("uuid")){
                   if(`${data[`${table}_email`]}` !== undefined){
                    if (emailRegex.test(`${data[`${table}_email`]}`)) {
                        columnToCheck= `${table}_email`
                     }else if (numberRegex.test(`${data[`${table}_email`]}`)) {
                        columnToCheck="number"
                     }else if (uuidRegex.test(`${data[`${table}_email`]}`)) {
                        columnToCheck="uuid"
                     }
                   }else if(data.number !== undefined){
                    if (emailRegex.test(data.number)) {
                        columnToCheck=`${table}_email`
                    }else if (numberRegex.test(data.number)) {
                        columnToCheck="number"
                    }else if (uuidRegex.test(data.number)) {
                        columnToCheck="uuid"
                    }
                   }else if(data.uuid !== undefined){
                    if (emailRegex.test(data.uuid)) {
                        columnToCheck=`${table}_email`
                    }else if (numberRegex.test(data.uuid)) {
                        columnToCheck="number"
                    }else if (uuidRegex.test(data.uuid)) {
                        columnToCheck="uuid"
                    }
                   }
                }
                var query=`select * from ${table} where ${columnToCheck}='${`${data[`${table}_email`]}` !== undefined ? `${data[`${table}_email`]}` : data.number !== undefined ? data.number : data.uuid}'`
                db.query(query,async(err,response)=>{
                    if(err){
                        reject(err)
                    }else{
                        if(response.length === 0){
                          const error=new Error(`No ${columnToCheck} registered`)
                          error.status=404
                          reject(error)
                        }else if(response.length>0){
                            if(forgetPassword){
                                resolve(response)
                            }else if(login){
                                var checkPassword= await bcrypt.compare(data.password,response[0].password)
                            
                            if(checkPassword){
                                response[0]["columnToCheck"]=columnToCheck
                                resolve(response)
                            }else{
                                let error=new Error(`Incorrect ${columnToCheck} / password`)
                                 error.status=401
                                reject(error)
                            }
                        }
                        }
                    }
                 })
                
                // login logic
            }else if(register){
                let query=`SHOW TABLES LIKE '${table}'`
                db.query(query,(err,response)=>{
                    if(err){                    
                        reject(err)                        
                    }else if(response.length<=0){                        
                        reject(1004)                               
                    }else{
                        
                        query=`SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = '${table}'
                        AND table_schema = '${dsl.db.database}'
                        AND column_key = 'UNI'`
                        
                        db.query(query, (err,response)=>{
                            if(err){
                                reject(err)
                            }                  
                            
                            else if(response.length > 0){
                                const mappedData = Object.entries(data).map(([key, value]) => ({ [key]: value }));
                                const matchedProperties = {};
                                
                                for (let i = 0; i < response.length; i++) {
                                    const columnName = response[i].column_name;
                                    for (let j = 0; j < mappedData.length; j++) {
                                        if (mappedData[j].hasOwnProperty(columnName)) {
                                            matchedProperties[columnName] = Object.values(mappedData[j])[0];
                                            break;
                                        }
                                    }
                                }
                                
                                for (let key in matchedProperties) {
                                    if (matchedProperties.hasOwnProperty(key)) {
                                        const columnValue = matchedProperties[key];
                                        query = `SELECT * FROM ${table} WHERE ${key}='${columnValue}'`;
                                        db.query(query,(err, result) => {
                                            if(err){
                                                reject(err)
                                            }else{
                                                if (result.length > 0) {
                                                    console.log(`${key} already exists`);
                                                    const error= new Error(`${key.toUpperCase()} Already Exists`)
                                                    error.status=409
                                                    reject(error)
                                                } else {
                                                    const {password,...rest}=data
                                                    query=`insert into ${table} set ?`
                                            db.query(query,rest,(err,result)=>{
                                                if(err){
                                                    reject(err)
                                                }else{
                                                    resolve(result)
                                                }
                                            })
    
                                          }
                                       }
                                     })
                                  }
                                }
                            
                            }else{
                                
                                const {password,...rest}=data
                                query=`insert into ${table} set ?`
                                db.query(query,rest,(err,result)=>{
                                    if(err){
                                        reject(err)
                                    }else{
                                        resolve(result)
                                    }
                                })
                                }
                        })
                    }
                })
            }      
     })
    }

    setPassword = async(password,userId,table)=> {
        return new Promise((resolve,reject)=>{
            bcrypt.genSalt(10)
                .then((salt) => {
                    return bcrypt.hash(password, salt);
                })
                .then((hashedPassword) => {
                    const query = `update ${table} set password=? where id=${userId}`;
                    db.query(query,[hashedPassword], (err, sqlresult)=> {
                        if(err){
                            reject(err)
                        } else{
                            resolve(sqlresult);
                        }
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };
    
}


module.exports=Auth
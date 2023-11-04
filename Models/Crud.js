const db=require('../Utilities/config')
const bcrypt = require('bcrypt');

    class Crud{
        constructor(){
            this.table=''
        }

        create=(table,data,request,userId,filter,filterValue)=>{
            return new Promise((resolve,reject)=>{
                const resetPassword=request ? (request.toLowerCase().includes('reset-password') || 
                request.toLowerCase().includes('password-reset') || request.toLowerCase().includes('reset-password-request') ||
                request.toLowerCase().includes('set-password') || request.toLowerCase().includes('setPassword')):""
                if((resetPassword) && userId){
                    const comparePassword=data.hasOwnProperty("comparePassword") || data.hasOwnProperty("confirmPassword") ||
                     data.hasOwnProperty("confirm-password") || data.hasOwnProperty("cPassword") || data.hasOwnProperty("c-password")
                     let query=`select * from ${table} where ${table}_id=${userId}`
                     console.log(">>>.",query);
                     db.query(query,(err,result)=>{
                        if(err){
                            reject(err)
                        }else{
                            if(result.length === 0){
                                let error=new Error("User ID does not exist")
                                error.status=404
                                reject(error)
                            }else if(result.length > 0){
                                if(comparePassword){
                                   const passwordProperties = ["comparePassword", "confirmPassword", "confirm-password", "cPassword", "c-password"];
                                   const passwordValues = passwordProperties.map(prop => data[prop]);
               
                                   if (!passwordValues.includes(data.password)) {
                                       let error=new Error("Password does not match")
                                       error.status=401
                                       reject(error)
                                   }
                                   else if(passwordValues.includes(data.password)){
                                       bcrypt.genSalt(10)
                                       .then((salt) => {
                                           return bcrypt.hash(data.password, salt);
                                       })
                                       .then((hashedPassword) => {
                                           const query = `update ${table} set password=? where ${table}_id=${userId}`;
                                           db.query(query,[hashedPassword], (err, sqlresult)=> {
                                               if(err){
                                                   reject(err)
                                               } else{
                                                   resolve("Password Updated Successfully");
                                               }
                                           });
                                       })
                                       .catch((err) => {
                                           reject(err);
                                       });
                                   }               
                                 }else{
                                     bcrypt.genSalt(10)
                                     .then((salt) => {
                                         return bcrypt.hash(data.password, salt);
                                     })
                                     .then((hashedPassword) => {
                                         const query = `update ${table} set password=? where ${table}_id  =${userId}`;
                                         db.query(query,[hashedPassword], (err, sqlresult)=> {
                                             if(err){
                                                 reject(err)
                                             } else{
                                                 resolve("Password Updated Successfully");
                                             }
                                         });
                                     })
                                     .catch((err) => {
                                         reject(err);
                                     });
                                 }
                            }
                        }
                     })
                } else{

                  let query = `SHOW TABLES LIKE '${table}'`;
                  db.query(query, (err, response) => {
                    if (err) {
                      reject(err);
                    } else if (response.length === 0) {
                      let error=new Error("Incorrect Table Name")
                      error.status=404
                      reject(error)            
                    }else if(response.length > 0){
                      // if params table name is correct then check for child tables
                      const childTablesResult = checkChildTables(data);
                      childTablesResult.then(async(childTables) => {
                   if(filter !== undefined){
                    var whereObj= getWhereObject(filter,filterValue)       
                  }
                        if(childTables.length > 0){
                          // if child tables exists then remove those arrays to have a clean data for upsertion
                          const destructuredObj= removeArrayofObjects(data,childTables)
                          var primaryKeys=[]
                          let primaryKeyData= await getPrimaryKey(table)
                          primaryKeys.push({
                            table:table,
                            primaryKeyData:primaryKeyData
                          })
                          const updateCase= checkForUpdateCase(primaryKeys,destructuredObj,)
  
                          let insertResult=create(table,destructuredObj)
                          insertResult.then((insertResult) => {
                            for(let x=0;x<childTables.length;x++){
                              query=`SELECT
                              CONSTRAINT_NAME,
                              TABLE_NAME,
                              COLUMN_NAME,
                              REFERENCED_TABLE_NAME,
                              REFERENCED_COLUMN_NAME
                            FROM
                              INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                            WHERE
                              TABLE_NAME = '${childTables[x]}'
                              AND REFERENCED_TABLE_NAME IS NOT NULL`
                              db.query(query,(err,constraints)=>{
                               if(err){
                                 reject(err)
                               }else{
                                  resolve(constraints)
                                  }
                                })                            
                            } 
                          }).catch((error)=>{
                            reject(error)
                          })               
                          }
                          else{
                          query=`insert into ${table} set ?`
                          db.query(query,data,(err, sqlresult)=>{
                            if(err){
                              reject(err)
                            }else{
                              resolve(sqlresult)
                            }
                          })
                        }
                      }).catch((err)=>{
                        reject(err)
                      })            
                    }
                  })
                }

            
            })
        }

        get = (table,id,join,associatedTables,filter,filterValue,filterData,page,limit) => {
            return new Promise((resolve, reject) => {
              if(filter !== undefined){
                var whereObj= getWhereObject(filter,filterValue)       
              }
              const forienTablesData=associatedTables === "yes" || associatedTables === "Yes" || associatedTables === "YES"
              let query = `SHOW TABLES LIKE '${table}'`;
              db.query(query, (err, response) => {
                if (err) {
                  reject(err);
                } else if (response.length <= 0) {
                  let error=new Error("Incorrect Table Name")
                  error.status=404
                  reject(error)            
                }
                else {
                  // Get foreign key constraints for the given table
                  query = `SELECT
                              CONSTRAINT_NAME,
                              TABLE_NAME,
                              COLUMN_NAME,
                              REFERENCED_TABLE_NAME,
                              REFERENCED_COLUMN_NAME
                            FROM
                              INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                            WHERE
                              TABLE_NAME = '${table}'
                              AND REFERENCED_TABLE_NAME IS NOT NULL`;
                  db.query(query, (err, constraints) => {
                    if (err) {
                      reject(err);
                    } 
                    else {
                      
                      // query for getting primary key
                      query=`SHOW KEYS FROM ${table} WHERE Key_name = 'PRIMARY'`
                      db.query(query,(err,primaryKey)=>{
                        if(err){
                          reject(err)
                        }
                          else{
                            
                            // Construct query to retrieve data from main table
                           query = `SELECT ${forienTablesData ? "*" : filterData ? filterData : table + ".*"},
                           (SELECT COUNT(*) FROM ${table} ${constraints.length > 0 ? constraints.map((constraint) =>
                            `${join ? join : ""} JOIN \`${constraint.REFERENCED_TABLE_NAME}\` ON \`${table}\`.${constraint.COLUMN_NAME} =
                            \`${constraint.REFERENCED_TABLE_NAME}\`.${constraint.REFERENCED_COLUMN_NAME}`
                           ).join(" ") : ""}${id ? ` WHERE ${table + "." + primaryKey[0].Column_name} = ${id}` : ""}${filter ? `${id ? " AND" : " WHERE"} ${Object.entries(whereObj)
                            .map(([key, value]) => `${key}${value}`)
                            .join(" ")}` : ""}) AS total_count
                           FROM \`${table}\`${constraints.length > 0 ? " " + constraints.map((constraint) =>
                            `${join ? join : ""} JOIN \`${constraint.REFERENCED_TABLE_NAME}\` ON \`${table}\`.${constraint.COLUMN_NAME} =
                            \`${constraint.REFERENCED_TABLE_NAME}\`.${constraint.REFERENCED_COLUMN_NAME}`
                           ).join(" ") : ""}
                           ${id ? ` WHERE ${table + "." + primaryKey[0].Column_name} = ${id}` : ""}${filter ? `${id ? " AND" : " WHERE"} ${Object.entries(whereObj)
                            .map(([key, value]) => `${key}${value}`)
                            .join(" ")}` : ""}${limit ? ` LIMIT ${page ? page : 0}, ${limit}` : ""}`;
                            db.query(query, (err, tableData) => {
                              if (err) {
                                reject(err);
                              } else {
                                // Construct queries to retrieve data from foreign key tables
                                const foreignKeyTables = constraints.map(
                                  (constraint) => constraint.REFERENCED_TABLE_NAME
                                );
  
                                // Execute all queries in parallel using Promise.all
                                const queries = [query, ...foreignKeyTables.map(
                                  (tableName) => `SELECT * FROM ${tableName}`
                                )];
                                for(let i=0; i<queries.length; i++) {
                                  db.query(queries[i], (err, allTablesData) => {
                                      if(err){
                                          reject(err);
                                      }else{
                                        if(allTablesData.length > 0){
                                          resolve(allTablesData);
                                        }else{
                                          let error=new Error("No record found")
                                          error.status=404
                                          reject(error) 
                                         }
                                      }
                                  })
                                }
                              }
                            });
                          }
                       
                      })
              
                    }
                  });
                }
              });
            });
          };

    }

    create = (table, data) => {
      return new Promise((resolve, reject) => {
        let query = `insert into ${table} set ?`;
        let results = [];
        for (let i = 0; i < data.length; i++) {
          let item = data[i];
          db.query(query, item, (err, sqlresult) => {
            if (err) {
              reject(err);
            } else {
              results.push(sqlresult);
              if (results.length === data.length) {
                resolve(results);
              }
            }
          });
        }
      });
    };
    
  getPrimaryKey =async (table) => {
      return new Promise((resolve, reject) => {
        let query = `DESCRIBE ${table}`;
        db.query(query,(err, primaryKey) => {
          if (err) {
            reject(err);
          } else {
            for(let i=0; i<primaryKey.length; i++) {
                if(primaryKey[i].Key === 'PRI'){
                  resolve(primaryKey[i].Field);
                }
              }
            }
          });  
        })  
  };

  checkForUpdateCase = (PrimaryKeyOftable, ToBeCheck) => {
    if (Object.keys(ToBeCheck[0]).includes(PrimaryKeyOftable[0].primaryKeyData) ) {
      console.log('Match found: category_id');
    }
  }
  
  getWhereObject = (filter, filterValue) => {
      if (filter && filterValue) {
      let newFilter;
      if (Array.isArray(filter)) {
        newFilter = filter.map((filter) => filter.replace("&&", " AND ").replace("||", " OR "));
      } else {
        newFilter = [filter.replace("&&", " AND ").replace("||", " OR ")];
      } 
      let values = Array.isArray(filterValue) ? filterValue : [filterValue];
      values = values.map((value) => {
        switch (value) {
          case "null":
            return null;
          case "false":
            return false;
          case "true":
            return true;
          default:
            return value;
        }
      });
      const whereObj = {};
      newFilter.forEach((f, i) => {
        whereObj[f] = values[i];
      });   
      return whereObj;
    }
  }
  
  checkChildTables = (data) => {
    return new Promise((resolve, reject) => {
      const childTables = [];
      const invalidTables = [];
      if (data && typeof data === "object") {
        let promises = [];
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            childTables.push(key);
            const childTable = key;
            const tableCheckQuery = `SHOW TABLES LIKE '${childTable}'`;
            const promise = new Promise((resolve, reject) => {
              db.query(tableCheckQuery, (err, checkChildTable) => {
                if (err) {
                  reject(err);
                } else {
                  if (checkChildTable.length === 0) {
                    invalidTables.push(childTable);
                    let error = new Error(`Incorrect Child Table ${invalidTables}`);
                    error.status = 404;
                    reject(error);
                  } else {
                    resolve();
                  }
                }
              });
            });
            promises.push(promise);
          }
        }
        Promise.all(promises)
          .then(() => {
            resolve(childTables);
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  };
  
  removeArrayofObjects = (data, table) => {
    const destructuredArray = [];
    for (const [key, value] of Object.entries(data)) {
      if (!table.includes(key)) {
        destructuredArray.push({
          [key]: value,
        });
      }
    }
    const result = destructuredArray.reduce(
      (acc, current) => Object.assign(acc, current),
      {}
    );
    return [result];
  };
  
  
    
module.exports=Crud    
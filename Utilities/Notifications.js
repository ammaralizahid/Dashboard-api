const nodemailer = require('nodemailer');

const sendEmail=async(from,to,template,subject,text)=>{

    return new Promise((resolve, reject) => {

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'amilzak42@gmail.com', // your email address
            pass: 'bmhj lcuc sjfo vgdh' // your email password
        }
    });
    
    // setup email data
    let mailOptions = {
        from: from ? from : "amilzak42@gmail.com", // sender address
        to: to, // list of receivers
        subject: subject, // subject line
        text: text ? text : "", // plain text body
        html: template ? template : "" // html body
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            reject(error);
        } else {
            console.log('Email sent: ' + info.response);
            resolve(info.response);
        }
    });
})
}

module.exports = {
    sendEmail
}
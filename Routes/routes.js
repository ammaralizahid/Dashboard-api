const router = require('express').Router();
const Crud=require('../Controllers/Crud.js')
const Auth=require('../Controllers/Auth.js')

// register, login , forget password route
router.post("/auth/:request/:userId?/:token?", Auth.request)
// generic post route
router.post("/write/:table/:userId?", Crud.create)
// generic get route
router.get("/read/:table/:id?", Crud.get);


module.exports = router;

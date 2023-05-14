
const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongodbclient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const URL =process.env.DB;

app.use(express.json());

app.get('/', async function (req, res) {
  res.json(
    'Server is running successfully!!! hit appropriate calls to get the response'
  )
})

app.post("/hall",async function(req,res){  //add a new hall in database
    try{
        const connection = await mongodbclient.connect(URL);  //open the connection 

        const db = connection.db("hallbooking")  //select database 
      
        await db.collection("hallbooking").insertOne(req.body);

        await connection.close();

        res.json({
            message : "added successfully"
        })
    }
    catch(error){
        console.log(error);
    }
})


app.get("/hall",async function(req,res){  //gets all hall information
try{
    const connection = await mongodbclient.connect(URL);

    const db = connection.db("hallbooking");

    console.log(req.body)
    
    let audience = await db.collection("hallbooking").find().toArray();

      await connection.close();

      res.json(audience);
}
catch(error){
    console.log(error);
}

})

app.get("/hall/:id",async function(req,res){  //gets information about the hall
    try{
const connection = await mongodbclient.connect(URL);

const db = connection.db("hallbooking");

let hall = await db.collection("hallbooking").findOne({_id:mongodb.ObjectId(req.params.id) })

await connection.close();

res.json(hall);
    }
    catch(error){
console.log(error);
    }
})


app.post("/customer",async function(req,res){  //Book a room
    try{
        const connection = await mongodbclient.connect(URL);  //open the connection 

        const db = connection.db("hallbooking")  //select database 
      
       
        const  date= new Date();

        req.body.startdate = `${date.toDateString()}`

        req.body.starttime = `${date.getHours()}:${date.getMinutes()}` ;

        req.body.isdeleted=`false`

       const available_room= await db.collection("hallbooking").findOne({Status:"not booked"});
     
      const a= await  db.collection("hallbooking").updateOne({_id:mongodb.ObjectId(available_room._id)},{$set:{"Status":"booked"}});


       if(a){

       req.body.room_id = available_room._id;
        await db.collection("customer").insertOne(req.body);
     
        res.json({
            message : "added successfully"
        })
       }
       else {
res.json({
    message : "No available rooms"
})
       }
       await connection.close();

       
    }
    catch(error){
       res.status(404).json({
        message : "Rooms Not found"
       })
    }
})

app.get("/customer",async function (req,res){  // gets all customers details , both previous and current customers
try{
    const connection = await mongodbclient.connect(URL);  //open the connection 

    const db = connection.db("hallbooking")  //select database 

    let customer = await db.collection("customer").find().toArray(); //finding particular document

    await connection.close();

    res.json(customer);  



}
catch(error){
console.log(error);

}

})

app.put("/customer/:room_id", async function (req,res){   //give room_id in /:id to update  //Soft deletes the customer info from room 
    try{
            const connection = await mongodbclient.connect(URL);  //open the connection 
    
            const db = connection.db("hallbooking")  //select database 
    
            const room_status_update= await  db.collection("hallbooking").updateOne({_id:mongodb.ObjectId(req.params.room_id)},{$set:{"Status":"not booked"}});

            var date = new Date();


            const customer_delete= await  db.collection("customer").updateOne({room_id:mongodb.ObjectId(req.params.room_id)},{$set:{"isdeleted":"true",
            "End_Date":date.toDateString(),"End_time":`${date.getHours()}:${date.getMinutes()}`}}); //Gives the end date and time during Checkout

            await connection.close();

            res.json({
                message : "Hope you liked our services , Do visit us again 😊"
            })

        }
           catch(error){
            console.log(error)
           }
        })

        app.get("/roomdata",async function(req,res){   //retrieves booked room datas
          try{
            const connection = await mongodbclient.connect(URL);

            const db = connection.db("hallbooking") ;
 
            const pipeline = [
                {
                  '$lookup': {
                    'from': 'customer', 
                    'localField': '_id', 
                    'foreignField': 'room_id', 
                    'as': 'result'
                  }
                }, {
                  '$match': {
                    'Status': 'booked'
                  }
                }, {
                  '$project': {
                    'Status': 1, 
                    'result': 1
                  }
                }
              ];
              
              const aggregate = await db.collection("hallbooking").aggregate(pipeline).toArray()
            
              res.json(aggregate);

            

              await connection.close();

             
            }
            catch(error){
                console.log(error);
            }


            
        })

        app.get("/bookedcustomers",async function(req,res){ //Retreives booked customers //note : customers end time is given only when they checkout
const connection = await mongodbclient.connect(URL);
const db = connection.db("hallbooking") ;

const find = await db.collection("customer").find({isdeleted:"false"}).toArray();

res.json(find);


await connection.close();


        })

    
app.listen(process.env.PORT ||3000, console.log('server running !!!') );

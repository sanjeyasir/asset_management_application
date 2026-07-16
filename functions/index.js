const functions = require("firebase-functions");
const {Firestore} = require("@google-cloud/firestore");



const db = new Firestore({

    projectId: "clouderp-system",

    databaseId: "test-erp"

});



exports.createEmployee = functions.https.onRequest(
async(req,res)=>{


    if(req.method !== "POST"){

        return res.status(405).json({

            success:false,

            message:"Only POST allowed"

        });

    }


    try{


        const employee = req.body;


        const ref = await db
        .collection("employees")
        .add({

            firstName: employee.firstName,

            lastName: employee.lastName,

            email: employee.email,

            department: employee.department,

            designation:
            employee.designation || "",

            status:
            employee.status || "Active",

            createdAt:
            new Date()

        });



        return res.status(201).json({

            success:true,

            employeeId:ref.id

        });



    }
    catch(error){

        console.error(error);


        return res.status(500).json({

            success:false,

            message:error.message

        });

    }


});
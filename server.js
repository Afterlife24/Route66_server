const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

var nm = require('nodemailer');
let savedOTPS = {};

app.use(cors());
app.use(bodyParser.json());

let db;
let client;


const uri = "mongodb+srv://Suraj:alcohal2002@suraj.2fxoc.mongodb.net/?retryWrites=true&w=majority&appName=suraj";
// Connect to MongoDB
async function connectToMongo() {
    try {
        client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        });
        await client.connect();
        db = client.db('Route66'); // Replace 'Dhanush6371' with your database name
        console.log('Connected to MongoDB');
        startServer(); // Start the server only after MongoDB connection is successful
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        setTimeout(connectToMongo, 3000); // Retry connection after 5 seconds
    }
}



// Helper function to get database
const getDatabase = async () => {
    if (!db) {
        await connectToMongo();
    }
    return db;
};

//Delayed server start
// function startServer() {
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//         console.log(`Server is running on http://localhost:${PORT}`);
//     });
// }

// Endpoint to send the order

app.post("/sendOrder", async (req, res) => {    
    try {
        const db = await getDatabase();
        const { dishes, tokenId, email, total, orderTime } = req.body;
        
        
    
        // Calculate total items and prepare dish names for email
        const totalItems = dishes.reduce((sum, dish) => sum + dish.quantity, 0);
const dishNames = dishes.map(dish => 
  `${dish.name} (${dish.quantity} x $${dish.price.toFixed(2)})`
).join('<br>');
    
        // Create order document
        const newOrder = {
          dishes: dishes.map(dish => ({
            id: dish.id,
            name: dish.name,
            price: dish.price,
            quantity: dish.quantity,
            image: dish.image
          })),
          total: parseFloat(total),
          orderTime: new Date(orderTime),
          createdAt: new Date(),
          status: 'pending',
          tokenId,
          email,
          isDelivered: false
        };
    
        // Insert into database
        const result = await db.collection('orders').insertOne(newOrder);
        const orderId = result.insertedId;
    
        // Prepare email content
        const emailOptions = {
        from: 'youremail@gmail.com',
        to: email, // Use email from req.body
        subject: "Order Confirmation",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2c3e50;">Order Confirmation</h1>
              <p>Dear Customer,</p>
              <p>Thank you for your order! Here are your order details:</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order #${tokenId}</h3>
                <p><strong>Order Time:</strong> ${new Date(orderTime).toLocaleString()}</p>
                <p><strong>Items (${totalItems}):</strong></p>
                ${dishNames}
                <p style="font-size: 1.2em; margin-top: 15px;">
                  <strong>Total: $${parseFloat(total).toFixed(2)}</strong>
                </p>
              </div>
              
              <p>Your order is being prepared and will be delivered shortly.</p>
              <p>If you have any questions, please contact us with your order number.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p>Warm regards,</p>
                <p><strong>Route66</strong></p>
                <p>Contact: contact@lekashmir.com</p>
              </div>
            </div>
          `,
          attachments: [{
            filename: 'food.jpg',
            path: "https://cdn.prod.website-files.com/605826c62e8de87de744596e/62fb492b87daf525c8b50dc7_Aug%2015%20Order%20Confirmation%20page%20best%20practices%20(%26%20great%20examples).jpg",
            cid: 'food'
          }]
        };

        transporter.sendMail(emailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
    
        res.status(200).json({ 
          success: true,
          message: "Order received successfully",
          orderId: orderId,
          tokenId: tokenId,
          orderTime: orderTime
        });
    
      } catch (error) {
        console.error("Order processing error:", error);
        res.status(500).json({ 
          error: "Internal server error",
          details: error.message 
        });
      }




});

// Endpoint to mark an order as delivered
app.post("/markAsDelivered", async (req, res) => {
    console.log("*******************entered into mark as delivered*************************")
    try {
        const db = await getDatabase();
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: "Order ID is required" });
        }

        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { isDelivered: true } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.status(200).json({ message: "Order marked as delivered successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error: " + error.message });
    }
});


app.post("/timeDetails", async (req, res) => {
    try {
        const { email,expectedTime } = req.body;
        console.log("email",email);
        var options = {
    from: 'youremail@gmail.com',
    to: email, // Use email from req.body
    subject: "Your order is being prepared",
    html: `
        <h1>Get ready to pick your order</h1>
        <p>Dear Customer,</p>
        <p>You can collect your order in </p>
        <p><strong>${expectedTime}</strong> </p>
        <p>We hope you'll enjoy your meal! If you have any questions or need further assistance, please don't hesitate to contact us.</p>
        <p>Warm regards,</p>
        <p><strong>Route66</strong></p>
        <img src='cid:food' alt='Order Confirmation' width='1000px'>
    `,
    attachments: [
        {
            filename: 'food.jpeg',
            path: "https://cdn.prod.website-files.com/605826c62e8de87de744596e/62fb492b87daf525c8b50dc7_Aug%2015%20Order%20Confirmation%20page%20best%20practices%20(%26%20great%20examples).jpg",
            cid: 'food'
        }
    ]
};

        console.log("3");
        // Send the email
        transporter.sendMail(options, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
        
        res.status(200).json({ message: "Order received successfully"});
    } catch (error) {
        res.status(500).json({ error: "Error: " + error.message });
    }
});


app.post("/timeDetails", async (req, res) => {
    try {
        console.log("entering into send expected time block");
        const { email, expectedTime } = req.body;
        var options = {
            from: 'youremail@gmail.com',
            to: email, // Use email from req.body
            subject: "Table Reservation Confirmation",
            html: `
                <h1>You can receive in 10 min</h1>
                
            `,
};

        console.log("3");
        // Send the email
        transporter.sendMail(options, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
        console.log("4");
        res.status(200).json({ message: "Reservation saved successfully", id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Error is as follows " + error.message });
    }
});

// Get orders from the database
app.get("/getOrders", async (req, res) => {
    try {
        const db = await getDatabase();
        const orders = await db.collection('orders').find({}).toArray();
        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ error: "Error: " + error.message });
    }
});



// Get reservations from the database



// Server-Sent Events route for orders
app.get('/streamOrders', async (req, res) => {
    try {
        const db = await getDatabase();
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendEvent = (change) => {
            res.write(`data: ${JSON.stringify(change)}\n\n`);
        };

        const ordersChangeStream = db.collection('orders').watch();
        ordersChangeStream.on('change', sendEvent);

        req.on('close', () => {
            ordersChangeStream.removeAllListeners('change');
        });
    } catch (error) {
        res.status(500).json({ error: "Error: " + error.message });
    }
});

// Server-Sent Events route for reservations



var transporter = nm.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: 'scanme684@gmail.com',
        pass: 'zvngultpfogdtbxj'
    }
});

app.post('/sendotp', (req, res) => {
    console.log("Check point 1");
    let email = req.body.email;
    let digits = '0123456789';
    let limit = 4;
    let otp = '';

    for (let i = 0; i < limit; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }

    console.log("Check point 2");
    var options = {
    from: 'yourmail@gmail.com',
    to: `${email}`,
    subject: "Email Verification Code",
    html: `
        <p>Dear User,</p>
        <p>We hope this message finds you well. Please use the One-Time Password (OTP) below to verify your email address:</p>
        <p><strong>${otp}</strong></p>
        <p>If you did not request this verification, please ignore this email or contact our support team for assistance.</p>
        <p>Thank you for choosing our service.</p>
        <p>Best regards,</p>
        <p><strong>Route66</strong></p>
    `
};


    console.log("Check point 3");
    transporter.sendMail(options, function (error, info) {
        if (error) {
            console.log(error);
            return res.status(500).send("Couldn't send OTP"); // Use `return` to ensure no further response is sent.
        }

        savedOTPS[email] = otp;

        // Automatically delete OTP after 60 seconds
        setTimeout(() => {
            delete savedOTPS[email];
        }, 60000);

        console.log("OTP sent successfully");
        res.send("Sent OTP");
    });
    console.log("Check point 4");
});

app.post('/verify', (req, res) => {
    let otpReceived = req.body.otp;
    let email = req.body.email;

    if (savedOTPS[email] === otpReceived) {
        return res.send("Verified"); // Use `return` to ensure no further response is sent.
    } else {
        return res.status(500).send("Invalid OTP"); // Use `return` to ensure no further response is sent.
    }
});




// Initialize MongoDB connection
connectToMongo();



module.exports = app;
const mongoose=require('mongoose')

const connectDB=async()=> {
    try {
        const conn = await mongoose.connect("mongodb://localhost:27017/user-auth");
        console.log(`MongoDB connected : ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); //1 means error, 0 means success
        
    }
}

module.exports=connectDB;
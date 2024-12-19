import mongoose from "mongoose";

export const connectDB = async()=>{
    try {
        const mongo_uri = process.env.MONGO_URI;
        const conn = await mongoose.connect(mongo_uri);
        console.log("Mongodb connected.",conn.connection.host);
        
    } catch (error) {
        console.log("Mongodb connection unsuccessfull",error);
        process.exit(1);  //process code 1 means exit with failure , 0 means success
    }
}
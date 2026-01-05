import httpStatus from "http-status";
import {User} from "../models/user.model.js";
import bcrypt ,{ hash } from "bcrypt";
import crypto from "crypto";
const login=async(req,res)=>{
    const {username,password}=req.body;
    if(!username || !password){
        return res.status(httpStatus.BAD_REQUEST).json({message:"Username and Password are required"});
    }
    try{
        const existingUser= await User.findOne({username});
        if(!existingUser){
            return res.status(httpStatus.NOT_FOUND).json({message:"User not found"});
        }
        const isPasswordCorrect= await bcrypt.compare(password,existingUser.password);
        if(!isPasswordCorrect){
            return res.status (httpStatus.UNAUTHORIZED).json({message:"Invalid Credentials"});
        }
        let token = crypto.randomBytes(16).toString("hex");
        existingUser.token=token;
        await existingUser.save();
        return  res.status(httpStatus.OK).json({message:"Login Successful", token:token});
    }catch(e){
       return  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:`Something Went Wrong : ${e}`} )
    }
}

const register= async (req,res)=>{
    const {name,username,password}=req.body;
    try{
        const existingUser= await User.findOne({username})
        if(existingUser){
            return res.status(httpStatus.FOUND).json({message:"user already exists"});
        }
        const hashedPassword=await bcrypt.hash(password,10);
        const newUser=new User({
            name:name,
            username:username,
            password:hashedPassword
        });
        await newUser.save();
        res.status(httpStatus.CREATED).json({message:"user resistered"})
    }catch(e){
        res.json({message:`Something Went Wrong : ${e}`})
    }
}

export {login,register};
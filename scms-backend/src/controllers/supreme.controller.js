import { principalModel } from "../models/principalprofile.schema.js";
import { supremeModel } from "../models/supremeprofile.schema.js";
import { generatePassword, generateTokens, generateUserId } from "../utils/generate.js";
import bcrypt from "bcrypt";

const registersupreme = async (req, res) => {
    try {
        const { userid, password } = req.body;
        if(!userid || !password){
            return res.status(400).json({
                message: "userid and password are required"
            })
        }
        console.log("reached")
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await supremeModel.create({
            userid:userid,
            password:hashedPassword
        })
        res.status(200).json({
            message: "user created successfully",newUser
        })
    } catch (error) {
        console.log(error)
        res.send(500, error)
    }
}
const loginsupreme = async (req, res) => {
    try {
        const { userid, password } = req.body;

        // Input validation
        if (!userid || !password) {
            return res.status(400).json({
                message: "User ID and password are required"
            });
        }

        // Find user by userid only
        const user = await supremeModel.findOne({ userid });

        if (!user) {
            // Use a generic message to prevent user enumeration
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // Compare password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(
            userid,
            '15m',  
            '7d'   
        );
        const UpdatedUser = await supremeModel.findOneAndUpdate({ userid: userid }, { refreshToken: refreshToken }, { new: true });
        // Set HTTP-only cookies
        res.cookie("refreshToken", refreshToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict'
        });
        
        res.cookie("accessToken", accessToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict'
        });

        // Send response
        return res.status(200).json({
            message: "User logged in successfully",
            user: {
                userid: user.userid,
                role: user.role,
                // Include other non-sensitive user data here
            },
            refreshToken,
            accessToken
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
}
const principalcreate = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email);
        
        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }
        
        const checkUser = await principalModel.findOne({ email });
        if (checkUser) {
            return res.status(400).json({
                message: "Principal already exists"
            });
        }
        
        const userid = generateUserId(8);
        const password = generatePassword(16);
        const newUser = await principalModel.create({
            email,
            userid,
            password: await bcrypt.hash(password, 10)
        });
        
        res.status(201).json({
            message: "User created successfully",
            userid,
            password
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export { registersupreme,loginsupreme,principalcreate }
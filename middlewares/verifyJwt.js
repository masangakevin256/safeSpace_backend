import jwt from "jsonwebtoken"
export const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if(!authHeader){
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    if(!token){
        return res.status(403).json({"message": "Token to verify required"});
    }

   jwt.verify(
    token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if(error){
            return res.status(400).json({"message": "Failed to verify tokens"});
        }
        req.user = decoded.userInfo;
        next()
    }
   ) 
}
//control notifications
import {pool} from "../config/connect_database.js"
export async function addNotification(sender_id, sender_role, recipient_id, recipient_role, type, title, message){
    try{
        const notification = await pool.query(
            `
            INSERT INTO notifications (sender_id, sender_role, recipient_id, recipient_role, type, title, message, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *;
            `,
            [sender_id, sender_role, recipient_id, recipient_role, type, title, message]
        )
        return notification.rows[0];
    }catch(error){
        console.error("addNotification error:", error?.message);
        throw new Error("Failed to create notification");
    }
}

//get notifications
//admin can get all
//counselor can get all notifications assigned to them
//user can get all notifications assigned to them

export const getNotifications = async(req,res)=>{
    const user = req.user;
    const user_id = user.user_id;
    try{
        let notifications;
        if(user.roles === "admin"){
            notifications = await pool.query(
                `
                SELECT * FROM notifications
                `
            )
        }else if(user.roles === "counselor"){
            notifications = await pool.query(
                `
                SELECT * FROM notifications WHERE   counselor_id = $1
                `
                [user_id]
            )
        }else if(user.roles === "user"){
            notifications = await pool.query(
                `
                SELECT * FROM notifications WHERE user_id = $1
                `
                [user_id]
            )
        }
        res.status(200).json({
            message: "Notifications retrieved successfully",
            notifications: notifications.rows
        })
    }catch(error){
        console.error("getNotifications error:", error);
        return res.status(500).json({
            message: error?.message || "Internal server error"
        })
    }
}

//delete notification
//admin and counselor can delete any notification
//user can delete their own notifications
export const deleteNotification = async(req,res)=>{
    const user = req.user;
    const user_id = user.user_id;
    const {notification_id} = req.params;
    try{
        const notification = await pool.query(
            `
            SELECT * FROM notifications WHERE notification_id = $1
            `
            [notification_id]
        )
        if(notification.rows.length === 0){
            return res.status(404).json({
                message: "Notification not found"
            })
        }
        if (user.roles === "admin" || user.roles === "counselor"){
            await pool.query(
                `DELETE FROM notifications WHERE notification_id = $1 RETURNING *`,
                [notification_id]
            )
        }else if(user.roles === "user" && notification.rows[0].sender_id === user_id){
            await pool.query(
                `DELETE FROM notifications WHERE notification_id = $1 RETURNING *`,
                [notification_id]
            )
        }else{
            return res.status(403).json({
                message: "You are not authorized to delete this notification"
            })
        }
        res.status(200).json({
            message: "Notification deleted successfully",
            notification: notification.rows[0]
        })
    }catch(error){
        console.error("deleteNotification error:",  error);
        return res.status(500).json({
            message: error?.message || "Internal server error"
        })
    }
}
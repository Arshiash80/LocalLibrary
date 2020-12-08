const mongoose = require('mongoose')

const Schema = mongoose.Schema

// User schema
const UserSchema = new Schema(
    {
        user_name: { type: String, required: true, maxlength: 100 },
        user_email: { type: String, required: true },
        user_password: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }
)


UserSchema
.virtual('url')
.get(function() {
    return '/user/' + this._id
})


module.exports = mongoose.model('User', UserSchema)
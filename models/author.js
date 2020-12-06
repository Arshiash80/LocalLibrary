const mongoose = require('mongoose')
const {DateTime} = require('luxon')
// Define a schema
const Schema = mongoose.Schema

const AuthorSchema = new Schema(
    {
        first_name: { type: String, required: true, maxlength: 100 },
        family_name: { type: String, required: true, maxlength: 100 },
        date_of_birth: { type: Date },
        date_of_death: { type: Date }
    }
)

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function() {
    return this.family_name + ', ' + this.first_name
})

// Virtual for author's lifespan

AuthorSchema
.virtual('lifespan')
.get(function() {
    let dob;
    let dod;
    if (this.date_of_death && this.date_of_birth) {
        dob = DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) 
        dod = DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    } else if (this.date_of_birth) {
        dob = DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED); 
        dod = null  
    }
    return {
        date_of_birth: dob,
        date_of_death: dod
    }
})

// Virtual for author's URL
// I'll use the property in my templates whenever 
// i need to get a link to a particular author.
AuthorSchema
.virtual('url')
.get(function() {
    return '/catalog/author/' + this._id
})

// Export model
module.exports = mongoose.model('Author', AuthorSchema)
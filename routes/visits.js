const express = require("express");
var router = express.Router();
const Visit = require("./../models/Visits");

router.get('/', function (req, res, next) {
    Visit.find().then(function (visits) {
        res.send(visits);
    });
});

router.post('/', function (req, res, next) {

    Visit.findOne({ siteId: ''+ req.body.siteId }, function (err,visitResponse) {
        if(err){
             return res.status(500).json({
                title: 'An error ocurred',
                error: err
            });
        }
        if(!visitResponse){
            //Not founded
            var visitEntry = new Visit({
                    siteId: req.body.siteId,
                    visitId: req.body.visitId,
                    author: req.body.author,
                    creationDate: req.body.creationDate
                });

                visitEntry.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            title: 'An error ocurred',
                            error: err
                        })
                    }

                    res.status(201).json({
                        message: 'Visit was saved',
                        obj: result
                    })
                })
        }
        else{
            //Founded

            visitResponse.siteId = req.body.siteId;
            visitResponse.visitId = req.body.visitId;
            visitResponse.author = req.body.author;
            visitResponse.creationDate = req.body.creationDate;

            visitResponse.save(function(err,visitRes){
                res.status(201).json({
                message: 'Visit already exits was modified',
                obj: visitRes,
                type: typeof (visitRes)
            });
            });
        }
    })

    /*
    Visit.findOne({ 'siteId': 'Test1' }).
        then(function (err, result) {
            res.status(201).json({
                message: 'Request Processed',
                obj: result,
                type: typeof (result)
            });
            */
            /*
            if (!result) {
                
                var visit = new Visit({
                    siteId: req.body.siteId,
                    visitId: req.body.visitId,
                    author: req.body.author,
                    creationDate: req.body.creationDate
                });

                visit.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            title: 'An error ocurred',
                            error: err
                        })
                    }

                    res.status(201).json({
                        message: 'Visit was saved',
                        obj: result
                    })
                })
            }
            else{
                res.status(201).json({
                message: 'Visit already exist but was updated',
                obj: result + typeof(result)
            })
        }
        */
        






});

router.delete('/:id', function (req, res, next) {
    Visit.findById(req.params.id, function (err, visit) {
        if (err) {
            return res.status(500).json({
                title: 'An error ocurred',
                error: err
            });
        }

        if (!visit) {
            return res.status(500).json({
                title: 'No Visit Founded',
                error: { message: "Visit not found" }
            });
        }

        visit.remove(function (err, result) {
            if (err) {
                return res.status(500).json({
                    title: 'An error ocurred',
                    error: err
                });
            }
            res.status(201).json({
                message: 'The visit was deleted',
                obj: result
            });
        })
    });
});

module.exports = router;
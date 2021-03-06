let indexDb = require("./indexedDb");
let message = require("./messages");

module.exports = {
    "visits": [],
    "visitSelected": {},
    "getVisits": function () {
        let reference = this;
        return new Promise(function (resolve, reject) {
            indexDb.getVisits().then(function (visitsResponse) {
                reference.visits = visitsResponse;
                resolve(reference.visits);
            });
        }).catch(function (err) {
            reject(err);
        });
    },
    "uploadVisitsToCloud": function () {
        console.log("Upload to Visit on Action");
        let reference = this;
        reference.getVisits().then(function (visits) {
            let cont = 0
            let visitsToUpdate = [];
            for (let visitsToUpd of reference.visits) {
                if (!visitsToUpd.cloud) {
                    this["visitsToUpdate" + cont] = reference.uploadVisit({
                        name: visitsToUpd.name,
                        siteId: visitsToUpd.siteId,
                        visitId: visitsToUpd.visitId,
                        author: visitsToUpd.author,
                        creationDate: visitsToUpd.creationDate
                    });
                    visitsToUpdate.push(this["visitsToUpdate" + cont]);
                    cont += 1;
                }
            }
            return new Promise(function (resolve, reject) {
                Promise.all(visitsToUpdate).then(function (values) {
                    console.log("Visits Update ", values);
                    resolve();
                }).catch(function (err) {
                    reject(err);
                })
            });
        });

    },
    "uploadVisit": function (dataToUpdate) {
        let updateVisitLocal = new Promise(function (resolve, reject) {
            indexDb.updateVisit(dataToUpdate.visitId).then(function () {
                resolve();
            });
        });

        let updateVisitCloud = new Promise(function (resolve, reject) {

            $.ajax({
                url: 'https://smart-docs.herokuapp.com/visits/?token=' + localStorage.getItem('token'),
                type: 'POST',
                dataType: 'json',
                data: dataToUpdate,
                statusCode: {
                    401: function () {
                        message.launchErrorNotAuthenthicateModal("La sesion ha caducado", "El token de seguridad que se te ha asignado ya no es valido", "Solucion: Inicia de nuevo Sesion");
                        localStorage.clear();
                    }
                },
                error: function () {
                    reject();
                },
                complete: function (msgRes) {
                    resolve(msgRes.responseJSON);
                }
            });
        });

        return new Promise(function (resolve, reject) {
            Promise.all([updateVisitLocal, updateVisitCloud]).then(function () {
                resolve();
            }).catch(function (err) {
                reject(err);
            });
        });
    },
    getVisitsSaveonCloud: function () {
        let reference = this;
        return new Promise(function (resolve, reject) {

            $.ajax({
                url: 'https://smart-docs.herokuapp.com/visits/?token=' + localStorage.getItem('token'),
                type: 'GET',
                dataType: 'json',
                statusCode: {
                    401: function () {
                        message.launchErrorNotAuthenthicateModal("La sesion ha caducado", "El token de seguridad que se te ha asignado ya no es valido", "Solucion: Inicia de nuevo Sesion");
                        localStorage.clear();
                    }
                },
                error: function () {
                    reject();
                },
                complete: function (msgRes) {
                    resolve(msgRes.responseJSON);
                }
            });
        });
    },
    "validateVisitLocally": function (visitsOnCloud, visitsLocally) {
        let visitsToUpdate = [];
        //Search for visits on the Cloud to update Locally
        for (let visitCloud of visitsOnCloud) {
            let visitFiltered = visitsLocally.filter(function (visit) {
                return visit.visitId == visitCloud.visitId;
            });
            //Cloud has visit that is not saved locally
            if (visitFiltered.length == 0) {
                visitsToUpdate.push(indexDb.addVisit(
                    visitCloud.visitId, visitCloud.siteId, visitCloud.name, visitCloud.author, true, visitCloud.creationDate));
            }
        }

        //Delete unexisting visits Locally
        for (let visitLocal of visitsLocally) {
            let visitFiltered = visitsOnCloud.filter(function (visit) {
                return visit.visitId == visitLocal.visitId;
            });
            if (visitFiltered.length == 0) {
                visitsToUpdate.push(indexDb.deleteVisit(visitLocal.visitId));
            }
        }

        return new Promise(function (resolve, reject) {
            Promise.all(visitsToUpdate).then(function () {
                resolve();
            }).catch(function (err) {
                reject(err);
            });
        });
    }
}
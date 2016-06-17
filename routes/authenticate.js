var express = require('express');
var router = express.Router();
var parseXml = require('xml2js').parseString;
var xml2js = require('xml2js');
var fs = require('fs');
var x = require('libxmljs');
var marklogic = require("marklogic");
var conn = require('../env.js').connection;
var db = marklogic.createDatabaseClient(conn);

module.exports = function (session) {

    router.post('/signup', function(req, res) {

        var user = {
        	first_name: req.body.first_name,
        	last_name: req.body.last_name,
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            role: 'user'
        };

        var newUserXML = '<?xml version="1.0" encoding="UTF-8"?><Korisnik xmlns="http://www.system.rs/scheme" role="' + user.role + '"><firstname>' + user.first_name + '</firstname><lastname>' + user.last_name + '</lastname><username>' + user.username + '</username><password>' + user.password + '</password><email>' + user.email + '</email></Korisnik>';
		
        // XSD schema
    	var XMLPath = 'xsd/Korisnik.xsd';
    	var xsd = fs.readFileSync(XMLPath, 'ascii');
    	
        var xsdDoc = x.parseXmlString(xsd);
        var xmlDoc = x.parseXmlString(newUserXML);
        //console.log(xsdDoc);
        //console.log("--------------------");
        //console.log(xmlDoc.toString());

        var result = xmlDoc.validate(xsdDoc);
        //console.log('Result: ' + result);
        //console.log(xmlDoc.validationErrors);
        
        if(!result)
        	return res.send("XSD validation error");


        // Check if user with username exists
        var q = marklogic.queryBuilder;
        console.log(user.username);
    	db.documents.query(
    		q.where(
    			q.collection('korisnik'),
    			q.value(q.element(q.qname('http://www.system.rs/scheme', 'username')), user.username)
    		)
    	).result()
		.then(function(response) {
			if(response.length > 0)
				return res.send({success: false, message: 'Korisnicko ime vec postoji'});
			else {
				// Dodavanje novog korisnika
		        db.documents.write({
					uri: '/korisnik/' + user.username + '.xml',
					contentType: 'application/xml',
					collections: 'korisnik',
					content: newUserXML
				})
		        .result(function (response) {

		        	res.json({
		                success: true,
		                message: 'User has been created!',
		                session: session
		            });
		        });
			}
		})
		.catch(function(error) {
		  	console.log('something went wrong: ' + error);
		});

    });

    router.get('/users', function(req, res) {
		var q = marklogic.queryBuilder;
		var users = [];

    	db.documents.query(
    		q.where(
    			q.collection('korisnik')
    		)
    	).result()
    	.then(function (response) {

    		for(var i = 0; i < response.length; i++) {

    			parseXml(response[i].content, function (err, result) {

	    			if (err) {
	    				return res.send(err);
	    			}

	    			users.push(result);
	    			
	    		});

    		}

    		res.json(users);

    	})
    	.catch(function(error) {
		  console.log('something went wrong');
		});

    });


    router.post('/login', function(req, res) {

    	var q = marklogic.queryBuilder;
    	var users = [];
    	
    	// get all users
    	db.documents.query(
    		q.where(
    			q.collection('korisnik'),
    			q.value(q.element(q.qname('http://www.system.rs/scheme', 'username')), req.body.username)
    		)
    	).result(function (response) {
    		
    		if(response.length == 0)
    			return res.send({success: false, message: 'Korisnik ne postoji'});

    		
    		parseXml(response[0].content, { explicitArray: false }, function (err, user) {
    			
    			if(err) 
    				return res.send(err);

    			//console.log(response[0]);
    			//console.log(user.Korisnik.password);
    			if(user.Korisnik.password == req.body.password) {
    				session = req.session;
    				session.uniqueId = req.body.username;

                    res.json({
                        success: true,
                        message: "Successfuly login!",
                        session: session
                    });
    			}


    		})

    	});


    });


    router.get('/me', function (req, res) {
        res.json(req.decoded);

        // Ovo koristi za brisanje documenata iz bazxe
        /*db.documents.remove('/korisnik/1.xml').result(
		    function(response) {
		      console.log(response);
		    } 
		);*/
    });

    router.post('/logout', function (req, res) {
    	console.log(req.session);
    	req.session.destroy(function (err) {
    		if(err)
    			res.send(err);

    		res.json({message: 'logout'});
    	})
    });

    router.post('/isLoggedIn', function (req, res) {
    	//console.log(req.session.uniqueId);
    	if(req.session.uniqueId) {
    		res.json({success: true, session: req.session });
    	}else {
    		res.send({success: false, session: null});
    	}

    });

	return router;
};
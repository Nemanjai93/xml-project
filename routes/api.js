var express = require('express');
var router = express.Router();
var parseXml = require('xml2js').parseString;
var xml2js = require('xml2js');
var fs = require('fs');
var x = require('libxmljs');
var marklogic = require("marklogic");
var conn = require('../env.js').connection;

var db = marklogic.createDatabaseClient(conn);

router.route('/akt')
	
	// Vraca usvojene akte
	.get(function (req, res) {
		var q = marklogic.queryBuilder;
		var aktovi = [];

    	db.documents.query(
    		q.where(
    			q.collection('akt')
    		)
    	).result()
    	.then(function (response) {

    		for(var i = 0; i < response.length; i++) {

    			parseXml(response[i].content, function (err, result) {

	    			if (err) {
	    				return res.send(err);
	    			}

	    			aktovi.push(result);
	    			
	    		});

    		}

    		res.json(aktovi);

    	})
    	.catch(function(error) {
		  console.log('something went wrong');
		});
	})

	// Predlaganje akta
	.post(function (req, res) {
		
		var newAkt = {
			
		};

		var newAktXML = '<?xml version="1.0" encoding="utf-8"?>\
						<Propis xmlns="http://www.system.rs/scheme" xmlns:test="http://www.system.rs/scheme">\
						  <Preambula>\
						    <PravniOsnov>' + req.body.PravniOsnov + '</PravniOsnov>\
						    <Podnosilac>' + req.session.uniqueId + '</Podnosilac>\
						    <Saglasnost>\
							  <Podnosilac>' + req.session.uniqueId + '</Podnosilac>\
						      <NaznakaSaglasnosti>' + req.body.NaznakaSaglasnosti + '</NaznakaSaglasnosti>\
						    </Saglasnost>\
						  </Preambula>\
						  <NazivPropisa>' + req.body.NazivPropisa + '</NazivPropisa>\
						  <Deo test:ID="123" test:RedniBroj="123">\
						    <NazivDela>' + req.body.NazivDela + '</NazivDela>\
						    <Glava test:ID="123" test:RedniBroj="123">\
						      <NazivGlave>' + req.body.NazivGlave + '</NazivGlave>\
						      <Odejlak test:ID="123" test:RedniBroj="123">\
						        <NazivOdeljka>' + req.body.NazivOdeljka + '</NazivOdeljka>\
						        <Pododeljak test:ID="123" test:RedniBroj="123">\
						          <NazivPododeljka>' + req.body.NazivPododeljka + '</NazivPododeljka>\
						          <Clan test:ID="123" test:RedniBroj="123">\
						            <NazivClana>' + req.body.NazivClana + '</NazivClana>\
						            <OznakaClana>' + req.body.OznakaClana + '</OznakaClana>\
						            <SadrzajClana>' + req.body.SadrzajClana + '</SadrzajClana>\
						          </Clan>\
						        </Pododeljak>\
						      </Odejlak>\
						    </Glava>\
						    <Glava test:ID="123" test:RedniBroj="123">\
						      <NazivGlave>' + req.body.NazivGlave + '</NazivGlave>\
						      <Odejlak test:ID="123" test:RedniBroj="123">\
						        <NazivOdeljka>' + req.body.NazivOdeljka + '</NazivOdeljka>\
						        <Pododeljak test:ID="123" test:RedniBroj="123">\
						          <NazivPododeljka>' + req.body.NazivPododeljka + '</NazivPododeljka>\
						          <Clan test:ID="123" test:RedniBroj="123">\
						            <NazivClana>' + req.body.NazivClana + '</NazivClana>\
						            <OznakaClana>' + req.body.OznakaClana + '</OznakaClana>\
						            <SadrzajClana>' + req.body.SadrzajClana + '</SadrzajClana>\
						          </Clan>\
						        </Pododeljak>\
						      </Odejlak>\
						    </Glava>\
						  </Deo>\
						  <Prilog>' + req.body.Prilog + '</Prilog>\
						</Propis>';
		
		// XSD schema
    	var XMLPath = 'xsd/Propis.xsd';
    	var xsd = fs.readFileSync(XMLPath, 'ascii');
    	
        var xsdDoc = x.parseXmlString(xsd);
        var xmlDoc = x.parseXmlString(newAktXML);
        console.log(xsdDoc);
        console.log("--------------------");
        console.log(xmlDoc);

        var result = xmlDoc.validate(xsdDoc);
        console.log('Result: ' + result);
        console.log(xmlDoc.validationErrors);
        
        if(!result)
        	return res.send("XSD validation error");


		db.documents.write({
			uri: '/akt/' + rek.body.NazivPropisa + '.xml',
			contentType: 'application/xml',
			collections: 'akt',
			content: newAktXML
		})
        .result(function (response) {

        	res.json({
                success: true,
                message: 'Dodali ste novi akt!',
                akt: response
            });
        });

	})

	// Povlaci predlog akta
	.delete(function (req, res) {
		db.documents.remove('/akt/' + req.params.name + '.xml').result(
		    function(response) {
		      console.log(response);
		      res.json({success: true, message: 'Akt je obrisan'});
		    } 
		);
	});


router.route('/amandman/:akd_id')
	
	// Predlog amandmana na predlog akta
	.post(function (req, res) {
		res.send({message: 'TODO predlaganje amandmana na predlog akta'});
	})

	// Povlaci predlog amandmana
	.delete(function (req, res) {
		res.send({message: 'TODO povlaci predlog amandmana'});
	});



module.exports = router;
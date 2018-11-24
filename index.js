const express = require('express');
const app = express();
const port = 1453;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/seoservice');
const request = require('request');
const cache = mongoose.model('cache', Schema(
    {
        url: String,
        site: String,
        cached_string: String,
        date: {type: Date, default: Date.now},
    }
));
const normalizeUrl = require('normalize-url');
app.get('/', (req, res) => res.send('Hello World!'));
app.get('/render', (req, res) => {
    if (req.query.url) {
        const url = normalizeUrl(req.query.url, {stripWWW: false});
        if (req.query.new) {
            var cached_src = '';
            request('http://localhost:3000/render/' + url, {json: false}, (err, res2, body) => {
                var rendered = body;
                if (rendered) {
                    cached_src = rendered;
                    res.send(cached_src);
                    save(cached_src, url);
                } else {
                    res.json({error: 'Error with url'});
                }
            });
            return;
        }
        cache.findOne({url: url}).sort({_id: -1}).exec((err, data) => {
            if (err) {
                var cached_src = '';
                request('http://localhost:3000/render/' + url, {json: false}, (err, res2, body) => {
                    var rendered = body;
                    if (rendered) {
                        cached_src = rendered;
                        res.send(cached_src);
                        save(cached_src, url);
                    } else {
                        res.json({error: 'Error with url'});
                    }
                });
            }

            if (data) {
                res.send(data.cached_string);
            } else {
                var cached_src = '';
                request('http://localhost:3000/render/' + url, {json: false}, (err, res2, body) => {
                    var rendered = body;
                    if (rendered) {
                        cached_src = rendered;
                        res.send(cached_src);
                        save(cached_src, url);
                    } else {
                        res.json({error: 'Error with url'});
                    }
                });

            }
        })
    } else {
        res.json({error: 'Error with url'});
    }
});


function save(string, url) {
    var who = normalizeUrl(url, {stripProtocol: true});
    who = who.split('/');
    who = who[0];
    var new_cache = new cache;
    new_cache.url = url;
    new_cache.site = who;
    new_cache.cached_string = string;
    new_cache.save();
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
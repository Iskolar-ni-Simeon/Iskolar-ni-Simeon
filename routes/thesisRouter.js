const express = require('express');
const router = express.Router();
const { SessionAuthentication } = require('../public/scripts/auth');
const { data } = require('autoprefixer');
require('dotenv').config();
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

router.get('/search', (req, res, next) => {
    const query = req.query.q || "";
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    res.render("./search.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
        token: req.cookies.authorization,
        server_api: process.env.SERVER_API,
        searchQuery: query
    });
});

router.get('/thesis/:id', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    try {
        const response = await fetch(`${process.env.SERVER_API}/thesis?uuid=` + req.params.id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.authorization}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                return res.redirect('/login');
            }
            return res.status(response.status).send('Error fetching thesis');
        }

        const thesis = await response.json();

        if (!thesis.data) {
            return res.status(404).render("./404.ejs", {
                picture: decryptedSession.picture,
                currentRoute: req.originalUrl,
            });
        };

        res.render("./thesis.ejs", {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            thesis: thesis.data
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/read/:id', async (req, res, next) => {
    console.log(req.params.id);
    try {
        // const response = await fetch(`${process.env.SERVER_API}/accessthesis?uuid=${req.params.id}`, {
        //     method: 'GET',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${req.cookies.authorization}`
        //     }
        // })
        // .then(res => {
        //     if (!res.ok) {
        //         if (res.status === 401) {
        //             return res.redirect('/login');
        //         }
        //         return res.status(res.status).render("./404.ejs", {
        //             picture: req.session.picture,
        //             currentRoute: req.originalUrl,
        //         });
        //     }
        //     return res.json();
        // })

        // const thesis = await response

        const thesis = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf'
        res.render("./read.ejs", {
            title: "SAMPLE",
            pdfLink: thesis,
        });

    } catch (err) {
        console.error('Error: ', err)
    }
});

router.get('/keyword/:keywordId', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    try {
        const response = await fetch(`${process.env.SERVER_API}/keyword?uuid=${req.params.keywordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.authorization}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                return res.redirect('/login');
            }
            return res.status(response.status).render("./404.ejs", {
                picture: decryptedSession.picture,
                currentRoute: req.originalUrl,
            });
        }

        const data = await response.json();

        if (!data.ok) {
            res.render("./404.ejs", {
                picture: decryptedSession.picture,
                currentRoute: req.originalUrl,
            });
        }

        res.render('./keyword.ejs', {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            keyword: data.data,
        });

    } catch (err) {
        console.error('Error: ', err);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/author/:authorId', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    try {
        const response = await fetch(`${process.env.SERVER_API}/author?uuid=${req.params.authorId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.cookies.authorization}`
                }
            }
        ).then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    return res.redirect('/login');
                }
                return res.status(response.status).render("./404.ejs", {
                    picture: decryptedSession.picture,
                    currentRoute: req.originalUrl,
                });
            }
            return response
        });

        // const data = {"ok":true,"data":{"name":"Jhal Albert Berioso","theses":[{"id":"c2ae3fc5-b07e-4b50-8aaf-f129886298b2","title":"Lived Experiences of Selected Parents in Selected Municipalities of Nueva Ecija with Children Diagnosed with Autism","year":"2024","abstract":"Background/Objective: Managing a child with autism poses significant challenges due to its complex neurodevelopmental nature, affecting social skills, communication, and behavior. Parents of children with autism spectrum condition (ASC) employ various strategies yet face obstacles such as a lack of social support, impacting parental stress and family dynamics. This study aims to be aware of the experiences of these parents whose child is diagnosed with ASC, and to unveil the efforts they do to cope. \nMethodology: This study utilized snowball and judgmental sampling to select the participants. Semi-structured interviews are conducted with ten participants in selected municipalities in District IV of Nueva Ecija, both in-person and online. The adaptation of thematic analysis is used to identify predominant themes, ensuring accuracy while maintaining the confidentiality and anonymity of the participants. \nResults: Thematic analysis revealed significant themes highlighting ASC's profound impact on families. Mothers primarily undertook caregiving roles, with fathers providing support. Common challenges encountered included stress, tantrums, exhaustion, societal judgment, and time management issues. However, themes of acceptance, familial bonds, and treating the child as typical arose amidst struggles. Coping mechanisms like \"me time\" and faith in God were identified, alongside additional efforts to meet the child's needs. \nConclusion: This study illuminates the complex challenges of parents managing ASC in District IV of Nueva Ecija. Despite hardships, resilience, acceptance, and familial unity prevail. Greater understanding and support are essential, including accessible interventions, respite care, and mental health support. Raising awareness and promoting acceptance can mitigate stigma and foster inclusive environments. Recognizing these challenges and strengths is vital for building a supportive society where everyone can thrive.","authors":[{"id":"20484536-a641-4579-9b28-db8a8419f0eb","name":"Jhal Albert Berioso"},{"id":"5418cbd4-2d9a-4df9-8c22-fc7c371ec4ea","name":"Axel Kendric Palon"},{"id":"571f59c6-5385-45b3-881e-6f5b3cd15d54","name":"Sami Andre Alexandre"},{"id":"6bf13b7f-db71-4248-9467-835596e5ce1b","name":"Thomas Franco"},{"id":"9098f6aa-01eb-4fe4-9229-f6ec62dd4d36","name":"Allen Dela Pena"},{"id":"d1fc7c7f-30ca-46af-886e-b15dde5c78ae","name":"Teruaki Otsubo"}],"keywords":[{"id":"0de4a243-d474-4a5c-b349-67994a4c0e2d","keyword":"asd"},{"id":"88158415-da12-44de-a9e4-8ea66638a6ea","keyword":"asc"},{"id":"951dfc42-d4bb-48b4-bd2d-ae8fce4151b2","keyword":"parents"},{"id":"acc1a454-3a57-4a1d-98f9-fb3426e0b6ff","keyword":"lived experiences"},{"id":"f3c8a7f1-2bb5-4a08-a7f2-38542ef7042a","keyword":"autism"}]}]}}
        const data = await response.json();
        res.render('./author.ejs', {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            author: data.data
        })
    } catch (err) {
        console.error('Error: ', err)
    }
});


module.exports = router;
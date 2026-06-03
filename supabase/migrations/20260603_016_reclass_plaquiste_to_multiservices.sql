-- ============================================================================
-- Migration 016 (2026-06-03) : reclassement plaquiste -> multiservices (NAF 43.39Z handyman)
-- ============================================================================
--
-- Suite de 012/014/015. Le bucket "multiservices" du triage (scripts/triage_naf4339z.py)
-- = fiches plaquiste dont le nom porte un signal polyvalent/handyman (multiservices,
-- renov, tout corps d'etat...) SANS nommer de metier specifique NI revendiquer
-- placo/platrerie. 749 fiches -> metier "Artisan multiservices" (cree migration 012,
-- meme NAF 43.39Z). Affichage plus juste qu'un "Plaquiste" generique ; NAF inchange.
--
-- pros.code_naf = '43.39Z' (vrai NAF, decouple du metier ; deja le cas mais idempotent).
-- IDEMPOTENT + TRANSACTIONNEL, memes garde-fous que 014/015.
-- VOIR : scripts/triage_naf4339z.py, exports/triage_naf4339z_multiservices.csv

BEGIN;

ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS code_naf text;

CREATE TEMP TABLE _reclass_016 (pro_id uuid PRIMARY KEY) ON COMMIT DROP;
INSERT INTO _reclass_016 (pro_id) VALUES
  ('7536b043-e74b-4dc1-803d-01deb3e1cfbe'::uuid),  -- 2M MULTISERVICE
  ('2b9bc083-0820-4015-bc82-ef3dd455fb24'::uuid),  -- A MULTISERVICE TEAM
  ('4a32588a-466c-4c44-8ec5-bef8df597f8d'::uuid),  -- A-Z MULTISERVICES
  ('2bf22b9e-1622-4950-86cd-28c7e9c21909'::uuid),  -- A.K RENOV
  ('1aa6a262-5b58-47a7-88d6-0117b194d126'::uuid),  -- A.L MULTISERVICES
  ('64b484ba-8381-48de-8a2f-e31dae417855'::uuid),  -- A.R.B. - ARTISAN RENOVATION BATIMENT
  ('c58950b3-6697-406b-a633-8554768b1567'::uuid),  -- A.S MULTISERVICES
  ('f81ec213-29b4-449a-bddf-600dbe9fc12e'::uuid),  -- A.V.S. MULTI-SERVICES
  ('0400f098-822b-4ed7-88cd-c65dcaa0515f'::uuid),  -- AB MULTISERVICE
  ('4b07fce8-45cb-4401-9154-d909004f8f77'::uuid),  -- ABC MULTISERVICES 87
  ('8be93279-7df8-4ed8-b7ee-30a9d2697891'::uuid),  -- ABD MULTISERVICES
  ('5ae12754-9f65-4941-b209-514bb96c4a69'::uuid),  -- ABEL MULTI-SERVICES
  ('58ead36b-8c67-4a11-86f8-e660d6d2d0a4'::uuid),  -- ABK RENOV'
  ('2c4ef4af-6540-4569-8ce2-cb742e440c18'::uuid),  -- ABS RENOV
  ('184c551a-a728-44e8-9c1d-0c0b2faf66ec'::uuid),  -- AC MULTI SERVICE
  ('1f1307ec-2204-42ef-843b-3bdbc6b74ecc'::uuid),  -- AC MULTI-SERVICES
  ('e3ca0999-b946-47ce-a5a2-fde8e05bb8ea'::uuid),  -- AC2N RENOVATION
  ('30b2b30d-bb54-48a9-a83d-073cdabce61a'::uuid),  -- ACO RENOV MULTI-SERVICE
  ('820e9ea6-7a51-4b13-ae0b-e163c62ef021'::uuid),  -- ACTIF RENOVATION ACTIF NETTOYAGE
  ('3dfa8037-594f-402b-9a80-e24f3304c65f'::uuid),  -- AD RENOV
  ('f8e4f855-9fad-4762-a5d9-53eb2f31881b'::uuid),  -- ADAK MULTISERVICE
  ('49776270-b725-4908-99fa-9374812e2993'::uuid),  -- ADI-RENOV
  ('7a0d4b5c-3805-45aa-92e9-be103b89123c'::uuid),  -- ADN MULTISERVICES
  ('36455b2a-9dde-4fbf-8476-7859e4036611'::uuid),  -- ADRIAN RENOVATION
  ('19766f2b-e854-4e1a-8365-cff3cbce646f'::uuid),  -- AG RENOV
  ('33857019-8b21-4c81-b368-7986da583430'::uuid),  -- AG RENOVATION
  ('f0413a35-a482-4a78-8399-c725fb7b851d'::uuid),  -- AG RENOVATION
  ('29ff8554-d63e-40b8-ac7f-84bf1309a67d'::uuid),  -- AGL RENOV
  ('509a14b3-a6ae-46d0-99fe-75fbf31bdea2'::uuid),  -- AGUILAR MULTISERVICES
  ('ac4c613f-80f3-4839-a569-4346c06c04dc'::uuid),  -- AH RENOV
  ('4054ec56-a5ef-47a3-b4af-184a6b0e0a20'::uuid),  -- AJ . RENOVATION
  ('56711cc0-a5ae-4a23-a498-6daf4c9de674'::uuid),  -- AJ RENOVATION
  ('8e96e74f-8006-45ea-9c4f-135c3f8f291e'::uuid),  -- AJ RENOVATION
  ('9b981397-4dc1-45be-9a04-02d5e5449b13'::uuid),  -- ALAN MULTISERVICES
  ('18313096-6cc4-47e1-a7e6-451b02fe9e39'::uuid),  -- ALBRET MULTI SERVICES
  ('faa21373-6419-45f5-be9a-adcd99197af5'::uuid),  -- ALEX MULTISERVICE
  ('871b4b2a-e816-43bc-aa36-4d74e3f1d5c2'::uuid),  -- ALEX RENOV
  ('65c5db37-60e6-4fc5-a85c-3967828f733b'::uuid),  -- ALLIANCE DRANCHUK RENOVATION
  ('2240857c-399c-427b-a551-78dc7ac696bd'::uuid),  -- ALLO ELIE NACELLE MULTISERVICES
  ('eaef4014-1dcc-476b-92d7-80e8aa776860'::uuid),  -- ALLO MULTI SERVICES HABITATION
  ('5d4735f9-2647-4655-836b-b0c9b24978cd'::uuid),  -- ALM MULTI SERVICES
  ('ee3abb2b-e1f9-45f8-8847-6209f7630d5b'::uuid),  -- ALPES GIFFRE MULTISERVICES
  ('6fc08e28-e774-4046-b291-9114419ac417'::uuid),  -- ALX ACCOMPAGNEMENT TRAVAUX ET MULTISERVICES
  ('845ffa68-8a70-44d5-aabc-a98734bcf91a'::uuid),  -- AM PRO RENOV
  ('79f2ea86-20da-434d-b8ee-34f1eb295ae8'::uuid),  -- AM RENOV 70
  ('8964f811-4b1f-4a46-b256-9495993de29f'::uuid),  -- AMEA RENOV
  ('fc91a213-802a-44f0-998a-569a1d21ffc0'::uuid),  -- AMF RENOVATION
  ('e622e31e-b325-4941-8fd1-794650fda2fe'::uuid),  -- AMS MULTISERVICES
  ('c9001357-3481-4547-9efd-55420acdfcfe'::uuid),  -- ANDRII RENOVATION
  ('a5483051-f9f7-42d2-9c7f-f71a6d8d5dd1'::uuid),  -- ANJOU MULTI SERVICE
  ('cb610705-f1c9-421e-b9ee-635684654426'::uuid),  -- ANTHONYJEANNEMULTISERVICES
  ('92705a7d-a7ff-4c69-b8e8-795d9b5c65ba'::uuid),  -- API RENOVATION
  ('5893b99a-25d4-44df-b892-ad1d3f92a266'::uuid),  -- APPO RENOV
  ('55f0b467-2c6c-482b-b9a6-db522c430b9d'::uuid),  -- AR RENOVATION
  ('00f2febd-f0e8-4036-a226-73a228b00fb0'::uuid),  -- ARCHETRIS RENOVATION
  ('16705ca4-a9ad-46b6-b2a2-58b80ba392f4'::uuid),  -- ARES MULTISERVICES
  ('312bfc10-46b7-40f5-9cd7-65a6967106cd'::uuid),  -- ARIEGE MULTISERVICES ET ENTRETIEN
  ('f916eec0-d638-4dc6-9c69-fe7496a84d18'::uuid),  -- ART & RENOVATION
  ('e5df00b8-f8ac-40bb-bca9-ee10f7717293'::uuid),  -- ART RENOV CONSTRUCT
  ('f71fe50e-0a7a-4445-b00c-b7902c4db666'::uuid),  -- ART'RENOVATION
  ('cc21b584-909c-45d1-95dc-30bdfaba53b9'::uuid),  -- ARTIS RENOVATION
  ('50051684-b8af-4f74-8ab3-9775b91fab20'::uuid),  -- ARTISAN CAP RENOVATION
  ('3374b047-e535-436e-a62b-9b504e1e4bc4'::uuid),  -- ARTON RENOV
  ('f8ea2eb4-37a1-4450-b58c-8cb973caf7f0'::uuid),  -- AT' RENOVATION
  ('e6f82575-524f-4408-a71c-257eff7056d7'::uuid),  -- ATELIER DAVID MULTISERVICES
  ('5b8f2bc0-6a75-4dc2-b191-12a71944c247'::uuid),  -- ATM RENOV
  ('a90ea890-b388-4574-aeef-7894902c6285'::uuid),  -- ATOUT RENOV
  ('fcf3f708-c767-4431-801a-6cb08ada9192'::uuid),  -- AURELIEN SABATIER MULTISERVICES
  ('46b0cd8e-2209-4a36-ac2f-8f015548bfb8'::uuid),  -- AVEN RENOVATION
  ('12402d2a-8458-488d-9702-d5bdcdeb6b2f'::uuid),  -- AYOUB RENOVATION ARCHITECTURE
  ('f772e9e2-2378-49dc-b034-e603eb59ab81'::uuid),  -- AZ RENOVATION
  ('ebc9d86e-1a32-4ed7-8a79-c6bb6ebdaa66'::uuid),  -- B&M RENOV'SOLUTIONS
  ('17b894b2-42dc-41e1-ab4e-b7d2b1857708'::uuid),  -- BARCHON RENOVATION
  ('8070fadf-36ab-40fb-9dc5-e282016f22e9'::uuid),  -- BATI-MULTI-SERVICES.FR
  ('edbccf65-3e31-43b3-8317-43c9e1a1288a'::uuid),  -- BATIMENT SERVICES RENOVATION
  ('f9ac9f32-e1cb-43c0-ad0e-6b09947d5357'::uuid),  -- BAUDELOT RENOVATION
  ('33f1645a-8a05-4d7b-8be0-4c3714a95c8e'::uuid),  -- BB MULTI-SERVICES
  ('ccacaec3-9def-47fd-80e2-fdd9438f4f6b'::uuid),  -- BC MULTISERVICES
  ('5510f67a-c44e-431f-b7fe-abbdbf75ddf5'::uuid),  -- BDC RENOV
  ('8acdfe20-6c75-4799-9a36-d2cca9144e8d'::uuid),  -- BEN RENOV
  ('b0bdf8af-7f4f-4e42-8925-67e579e7f958'::uuid),  -- BENBAT RENOVATION
  ('3b3549ca-87ae-456c-a164-71636bc94f51'::uuid),  -- BERGAMO RENOV
  ('6c066397-0e6f-433c-b953-f63446c0bb78'::uuid),  -- BERTRAND MULTISERVICE
  ('4dbcb376-281a-4535-93fe-7e07cb432bad'::uuid),  -- BETTA RENOV
  ('52812573-f830-4dba-b719-b7253bfc9645'::uuid),  -- BGK RENOVATION
  ('36b60d46-7ae4-46c3-8904-820b475bbcf4'::uuid),  -- BICHET MULTISERVICES
  ('b36ecf33-5257-4c06-bdf3-bcee63139c38'::uuid),  -- BL RENOVATION 05
  ('037ba248-7785-41e5-8c46-33a1df4164c9'::uuid),  -- BMS 16 - BEAULIEU MULTI-SERVICES 16
  ('bf0482c3-11d8-4962-b9bb-927303b07971'::uuid),  -- BOCQUIER MULTI-SERVICES
  ('cf047ebd-6909-4980-afe2-bf56296454a4'::uuid),  -- BOGDAN MULTI SERVICE
  ('03f8a344-6436-4548-8582-3a8a5ed2c3cb'::uuid),  -- BONNEFOY RENOVATION
  ('b7ab0995-6c67-4b7e-a504-3c0eb11b73f0'::uuid),  -- BOUQUEREL RENOVATION
  ('23beb4a3-2cd7-438a-a0a6-ae50630d6b30'::uuid),  -- BOUSBATA MULTISERVICE
  ('b61a842a-1b63-40af-90e4-7cd6137ee53e'::uuid),  -- BPRO RENOVATION
  ('a66d5a92-2c09-4e28-847d-d53cea95d712'::uuid),  -- BRICO RENOV'
  ('db95afaa-4157-4be8-9031-34d9243859d8'::uuid),  -- BRICOLO MULTISERVICES
  ('013ec9e1-0aef-4a47-8642-eaf04074bf29'::uuid),  -- BRUCH NETTOYAGE MULTISERVICES
  ('553cc598-8c19-4f1a-9a7e-9d6f4310f30e'::uuid),  -- BRUN RENOVATION
  ('306bb327-6b8d-4349-a80e-78ac6fbd38db'::uuid),  -- BRUNEL MULTI SERVICES
  ('bd2a4b26-4014-4a61-9604-7e79d9f16fa7'::uuid),  -- BRUNEL MULTISERVICES
  ('f386acee-1e11-43dc-b39f-3c3de05a6dfe'::uuid),  -- BS MULTISERVICES
  ('0ec58412-6236-4bc2-bf94-b7fb21acd69e'::uuid),  -- BT MULTISERVICES
  ('6ac31646-ee1f-4b79-ae3c-3b168e19e66d'::uuid),  -- BTP RENOV
  ('7f5ffbf8-31a9-4942-bf32-732cdaf230f7'::uuid),  -- BVI CONCEPT RENOVATION
  ('26ca5678-021a-48bf-a50e-35da39adbdbe'::uuid),  -- BY NETTOYAGE & MULTISERVICES
  ('7c299173-7b68-420e-98d0-beadf8504185'::uuid),  -- C'RENOV
  ('b9f0db50-dc7a-494a-83d9-ee1efd9e2ee6'::uuid),  -- C'RENOV'TOUT
  ('7710f421-cd30-4629-8e42-bd0232c0dabd'::uuid),  -- C.RENOV
  ('094970aa-a205-4200-9e4c-80c68733c7b6'::uuid),  -- CAPATINA RENOV
  ('7fd4350d-f01b-4599-a7b7-e43f6bef8e72'::uuid),  -- CAPMULTISERVICES39
  ('6f556529-0c8b-4350-931e-80173e69db6e'::uuid),  -- CARLY RENOVATION
  ('b6da6a24-116f-4974-9658-432841c9a539'::uuid),  -- CARRY RENOV
  ('6e9d1d82-06d2-4f52-9c6b-162c54f54689'::uuid),  -- CASA RENOV
  ('96bcb966-a51d-4338-b917-7f0d37d66f91'::uuid),  -- CASTEL CONSTRUCTION RENOVATION
  ('f8c3aa89-6a8f-4173-9d71-d0c944f9e9cf'::uuid),  -- CAZAC RENOVATION
  ('0a85c726-1d1d-4f9b-9ef4-03c53143cfe4'::uuid),  -- CBS MULTISERVICES
  ('692c6aaa-f4a3-47fc-9261-1af0dee39f5e'::uuid),  -- CC RENOV
  ('29a3ce9b-f8dd-49c5-aed8-632a4f62e438'::uuid),  -- CCB MULTISERVICES
  ('63c2d0e7-a5bd-449d-b862-42c6c89b2df1'::uuid),  -- CEDRIC MULTI SERVICES
  ('39895983-2804-4793-861d-003d21d49b73'::uuid),  -- CG MULTISERVICES
  ('64604439-11b1-4fc0-a75b-786988bd7b87'::uuid),  -- CGL RENOVATION
  ('1730c332-3b7d-4ba0-afad-e1de4dd00811'::uuid),  -- CH RENOVATION
  ('7a886545-d7eb-4c25-86de-ebae8efbd5d4'::uuid),  -- CH RENOVATION 14
  ('487f885e-b229-4e0e-a2d1-cf42f006bfb9'::uuid),  -- CHRIS RENOV
  ('c8e4b9c4-84cc-49c1-ab22-b34077062d10'::uuid),  -- CHRIS RENOVATION
  ('9ef03fc5-de7f-413a-8aac-e4d7a4872cf8'::uuid),  -- CHRISTIAN BOURGOIN MULTI SERVICES
  ('d674f78d-0909-448e-9523-7fa5643c91db'::uuid),  -- CHRISTOPHE LACHAUD MULTISERVICES
  ('6fe918b0-16eb-4c3b-982e-a4ea2693d0f3'::uuid),  -- CJ MULTISERVICES
  ('b47df949-bbac-4c13-a959-d6bd35c05be4'::uuid),  -- CLOVIS RENOVATION
  ('fcd62549-afb9-47bf-b58f-4416ac8bd9ab'::uuid),  -- CMK RENOVATION
  ('527e8803-aed1-4315-88a7-9e863323aabc'::uuid),  -- CMS CHRISTOPHE MULTISERVICES
  ('055fc861-1d4a-40da-a4b6-2f62996815cd'::uuid),  -- CMULTISERVICES
  ('c14bab88-4054-4109-81ec-c466f30f28be'::uuid),  -- COLIN MULTI SERVICE
  ('70040acb-b58a-44a8-9f56-49225fe3a882'::uuid),  -- CORSE TRAVAUX RENOVATION
  ('98697344-ed6c-4df6-be82-410869fab9df'::uuid),  -- COUP 2 MAIN 23 MULTI SERVICES
  ('6b452040-a4cd-4bc4-aceb-440a3fca53f5'::uuid),  -- COURTIAL RENOVATIONS
  ('9a2f87e4-317a-4bed-a803-9be86c40ca97'::uuid),  -- CQ CREATION RENOVATION
  ('0afd2d23-6713-42b1-a43d-f14c1d1e6769'::uuid),  -- CR MULTI-SERVICES
  ('691b3362-b39e-4bfd-a884-e5273356b2d4'::uuid),  -- CR MULTISERVICE
  ('1c381514-4f4f-4796-862f-c9ea379699b3'::uuid),  -- CR MULTISERVICES
  ('2d767e2c-a633-4c76-9ff2-911eeab8617c'::uuid),  -- CVM RENOV
  ('8e27a18f-5ea8-4c2f-b122-b48186eeb256'::uuid),  -- CYRIL MULTISERVICES
  ('388a1451-ae4b-4bee-ab82-eea8fc39cb38'::uuid),  -- D&A RENOVATION ENTRETIEN ET AMENAGEMENT INTERIEUR
  ('8c26db96-cac0-4cc9-846a-33d547b00c78'::uuid),  -- D&C RENOVATION
  ('b3a745c5-7fc4-4984-abe1-757cb11af267'::uuid),  -- D.E.RENOV
  ('2ff868a4-5fc0-409b-b661-61d9c2748690'::uuid),  -- DA CONSTRUCTION ET RENOVATION
  ('a8312ad3-70ba-4f99-854d-5faa16a4062d'::uuid),  -- DAGUET MULTISERVICES
  ('1bb76fdc-4d99-4f4d-aa23-fe6186878602'::uuid),  -- DAM-RENOV
  ('758216d1-40f0-40ed-8298-090877bfe4f5'::uuid),  -- DAVID JASPARD RENOVATION
  ('d438c581-7221-4a85-8ad3-7f1c42ad0ae0'::uuid),  -- DAVID MULTISERVICES
  ('39eb386b-8093-446d-bf19-bee1f6835547'::uuid),  -- DAVID RENOVATION MULTISERVICES
  ('de2f2002-5653-4018-a846-9d3ad2b2e9fd'::uuid),  -- DAVILOU MULTISERVICES
  ('34caba73-9e85-46aa-a111-0522eeb6b147'::uuid),  -- DCR RENOVATION 64-40
  ('e66e0517-3acf-4a8e-9a1b-1c1d21605de2'::uuid),  -- DE CARVALHO MULTI-SERVICES 46
  ('0b15776a-d70d-4652-b118-95bfd6023e22'::uuid),  -- DELACRE RENOV
  ('630413f2-3d7e-445b-b0f2-d1004cc2e1e1'::uuid),  -- DELAMARE RENOVATION
  ('d1c6c8cc-3904-4078-8622-e23d583e3f10'::uuid),  -- DELAURIER RENOV'
  ('056a887a-3812-4439-b623-5b9ec2a28b1a'::uuid),  -- DEMORTIERE MULTI SERVICE
  ('e9de5b7e-8dbf-423a-b0bf-06de0f93f0ca'::uuid),  -- DEPANNE & RENOVE
  ('60f2e897-4473-4346-bfcf-ab814c272ae9'::uuid),  -- DF ALPES RENOVATION
  ('aadb6bfe-0986-4c89-afe7-e72a2e1f3edd'::uuid),  -- DF RENOV 14
  ('d09faec5-e10b-429c-996f-d0f47c4803ce'::uuid),  -- DFS MULTI SERVICES
  ('92df7cae-be5d-4b9b-8d57-3d6658b1bab1'::uuid),  -- DG MULTISERVICES
  ('460fca08-6651-4753-87fd-c70c5c4cc889'::uuid),  -- DG MULTISERVICES SOLUTIONS
  ('2f6431e5-66f2-4b44-925f-585cf507b4e3'::uuid),  -- DG RENOV
  ('9316bc7b-945d-404d-85a5-f812922be256'::uuid),  -- DH MULTISERVICES
  ('7519477c-eff7-4641-9628-e27bc2516a3b'::uuid),  -- DIM MULTI SERVICES
  ('ac6df12e-43b4-47dc-9212-be0fbdf9f45c'::uuid),  -- DIMITRIMULTISERVICES80
  ('c5f9dbd4-e431-49bc-b9b2-c77b7f529716'::uuid),  -- DJEMS RENOVATION
  ('a4678788-e27c-4eab-84cc-d986cb11508a'::uuid),  -- DL RENOV 82
  ('d8284e80-9128-4a85-b595-e86c0676d56c'::uuid),  -- DL RENOVATION
  ('ee797121-a801-4423-a505-8cd91e14fc34'::uuid),  -- DLG  MULTI-SERVICES
  ('10862468-58f2-42e4-8f3a-d81f45ece1ce'::uuid),  -- DM MULTI SERVICES
  ('13c7ed4c-9628-48e6-8283-497216c80b05'::uuid),  -- DM RENOVATION
  ('5ce3db71-055b-4fee-a532-d3238e525bbf'::uuid),  -- DM RENOVATION
  ('b4faa928-9817-419e-8c83-6e63ea947998'::uuid),  -- DMG RENOV
  ('5cd27cf8-ebd4-46eb-ac7c-f8bb5d6e02a4'::uuid),  -- DO RENOV
  ('d6267c02-bd1f-4500-8563-676263028d84'::uuid),  -- DODAJ RENOVATION
  ('20233289-a99b-4c17-81b8-b67b0da94ea2'::uuid),  -- DOM'MULTISERVICES
  ('27177407-5d0e-427b-9203-a3e5b13de46b'::uuid),  -- DONO MULTISERVICES
  ('1f8f5c24-39b9-4930-b20d-705d56b94a14'::uuid),  -- DP RENOVATION
  ('638f00a9-e6db-4d23-86ed-05cf72c0f6e9'::uuid),  -- DREAM RENOVATION
  ('fc933697-791f-44fd-b2ce-46e7d9dabb95'::uuid),  -- DS MULTI SERVICES
  ('a10665b2-1fc1-4550-a0fa-b4beef2669a1'::uuid),  -- DUBOIS MULTI SERVICES
  ('1ea9a416-70fa-4803-87d4-09d3ab6c1e80'::uuid),  -- DUN'BAT RENOV
  ('6f98171a-711c-4b50-93ee-be92ce326a58'::uuid),  -- DW.RENOV
  ('2903045f-533a-4ffc-bf8c-dcd2a8e4b943'::uuid),  -- E. G. RENOVATION
  ('d1d0b7a9-e0f3-49c2-9aa2-5cac6db10280'::uuid),  -- E.L RENOV
  ('34e9a7ab-f28b-445b-b04a-63a409f8f0c7'::uuid),  -- EASY RENOVE
  ('923b49a6-24b1-4819-a0af-1eba049458a5'::uuid),  -- ECO DU LOGIS - RENOV'
  ('d0335c4b-f475-46aa-8f77-c3253b95eac4'::uuid),  -- ECO PERCHE RENOV
  ('7ea7a038-d6f3-4710-9cf0-8473f85088aa'::uuid),  -- ECR RENOVATION
  ('b9c73a2a-2fee-43ca-8a23-80877891cb4a'::uuid),  -- EG10 MULTISERVICES
  ('b5198ba5-a7e8-461e-9e63-e6323ebaae93'::uuid),  -- EI MUSCA - D M RENOVATION
  ('eb2b47c0-b7ab-4478-994c-bcc888e782e6'::uuid),  -- EL RENOV
  ('0446889f-d974-49fb-9bc9-51369e6d57ae'::uuid),  -- EMILIEN RENOVATION
  ('9fe4148f-630a-4375-ab4c-59b5ef826eb1'::uuid),  -- EMS - EPAGNY MULTI SERVICES
  ('69a13a0d-a896-452b-af72-5d6607d0f933'::uuid),  -- ENTREPRISE DE RENOVATION INTERIEURE - ERI
  ('5022f656-1d11-4ba3-aa0e-62c6a08d1736'::uuid),  -- ENTREPRISE MULTISERVICES AF
  ('c2198f7c-9ef0-4060-9c27-14e5f086e313'::uuid),  -- EPIC RENOV
  ('6d5cda73-a6b1-4616-908d-566a6707fc42'::uuid),  -- ER RENOVATION
  ('d1d5fd9a-0a76-4048-8b96-cbefadc076cd'::uuid),  -- ERIC MULTISERVICE
  ('b9982fda-44b5-4c96-8e68-f1506dd8c5f6'::uuid),  -- ERIC RENOV'SERVICES
  ('1f402522-4dbd-45af-9b48-bdae02a39b40'::uuid),  -- ES RENOVATION
  ('95fb0a99-19eb-4191-9bbf-422f167b45e1'::uuid),  -- ESCANDE RENOVATION
  ('6812be0a-678e-4780-ba88-b83d7f2e2da6'::uuid),  -- ESG RENOVACTION
  ('decc5bf7-62c9-4a1c-9c58-8165eba214e0'::uuid),  -- ESPRIT CLAIR MULTISERVICES
  ('b95fa6f8-68a0-4705-96b3-d9f2f0e836cd'::uuid),  -- ESQUIAN MULTI-SERVICES
  ('e5032918-c3cf-455b-be02-ad1c91879355'::uuid),  -- ESTELVIO CONSTRUCTION RENOVATION
  ('65559d06-43e0-4f18-8242-e7b1d70aca44'::uuid),  -- ETIENNE MULTISERVICES
  ('61e964b8-d7bc-4280-b544-bba2e99fe05b'::uuid),  -- EURL ENTRETIEN MULTI SERVICES
  ('181e1c03-48ea-47ec-9a8f-5772db989337'::uuid),  -- EXTREME SUD MULTISERVICES
  ('1a695a35-a758-4ff4-a4ef-37c799326c07'::uuid),  -- FAVIER JORDAN MULTISERVICES
  ('fa3fc761-5366-4d21-b8ce-b3a7097400cf'::uuid),  -- FB RENOV
  ('dc8666f1-5f6a-4c1d-98f4-f2a32eaa8087'::uuid),  -- FD MULTISERVICE
  ('5cfdd7ec-1a5c-47a2-bf62-3e3afca2418e'::uuid),  -- FD RENOVATION
  ('5b7b8468-4327-4674-9a03-78a70822e1f1'::uuid),  -- FEL RENOVATION
  ('3552c21b-947d-460b-9f63-bac5e95d6ef7'::uuid),  -- FGN RENOVATION
  ('471a73a0-a5cb-43ca-b62e-d7ac84607b98'::uuid),  -- FILIPPELLI  RENOVATION
  ('ddb16868-8b6f-4c24-8e2c-15af6b40685f'::uuid),  -- FINITION RENOV
  ('4c0592a8-88db-4058-af21-54b0ee27b36e'::uuid),  -- FIXO MULTISERVICES
  ('04b00d82-0a4a-418e-8929-9e97db4a7ffe'::uuid),  -- FK RENOVATION
  ('d11db03e-f950-44d3-bf6c-621ea93f4839'::uuid),  -- FL RENOV
  ('94757f25-fbf5-48e5-a99c-f231a14a1b66'::uuid),  -- FLO MULTISERVICES
  ('85e21493-90cc-49c9-8378-d3ec34a20d11'::uuid),  -- FLO MULTISERVICES 64
  ('2a6ea862-f6b3-40d2-85ee-595e3101943d'::uuid),  -- FM RENOV
  ('9cfb9673-d82a-4f08-a877-ab409811687f'::uuid),  -- FMEK RENOV
  ('fe3421f4-566c-40c0-a696-b5a0b1d4ae75'::uuid),  -- FNX MULTI-SERVICES
  ('953f7f40-e32a-4a9b-a2dc-902b422dbcba'::uuid),  -- FOURCHON RENOV
  ('668a0d93-2e3d-47c3-b2d9-2f36df916008'::uuid),  -- FOURNIE MULTISERVICE
  ('14a5e961-2506-4e25-94cc-04218c807a0e'::uuid),  -- FRANC JOURDIN MULTISERVICES
  ('894a0c25-fd24-4ebe-b7bb-cb17b190ae23'::uuid),  -- FRANCHE RENOVATION
  ('6694f153-ef34-4b64-93cd-7f0342711d42'::uuid),  -- FRANCK MULTI SERVICES
  ('f8bc77a0-5d7b-4f99-8016-82a17b8ed4f7'::uuid),  -- FRANCK MULTISERVICES
  ('52062995-7e48-4c5e-b4f0-2ef9b4678b7c'::uuid),  -- FRED MULTI-SERVICES
  ('81ec3c6b-7246-4e08-94bb-6638e7aee37f'::uuid),  -- FRED PROJEC'T MULTISERVICES
  ('b3477598-8cf6-4d12-83d1-0e46d81929e3'::uuid),  -- FULL RENOV
  ('51deb811-066e-40ec-8901-9bfb75471e5d'::uuid),  -- G ET R RENOVATION
  ('769b6651-b053-4238-bb9f-fa163a3bcd44'::uuid),  -- G RENOV'MH
  ('305aab37-7354-45d6-bdba-a2edd2c51fb7'::uuid),  -- G'NETTOYAGE  MULTISERVICES
  ('6442cdde-1714-4989-b822-ad46220bbef8'::uuid),  -- G.R MULTI-SERVICES
  ('ca409cb2-9cef-4639-a7da-9751908a147b'::uuid),  -- GADOR MULTI TRAVAUX - RENOVATION
  ('4ea8b3a5-64e8-4f25-b994-088ef53a3c29'::uuid),  -- GAJU MULTISERVICES
  ('c2129793-1681-4ad0-bfab-1511062f2a02'::uuid),  -- GAOUA RENOV
  ('eecb0a4e-6881-4617-962f-32eea8a1a816'::uuid),  -- GARDEN DESIGN MULTISERVICES
  ('cd7dc74d-316f-4a46-93b2-9b922b0e4113'::uuid),  -- GAUTHIER MULTI SERVICES
  ('d6b10505-6163-42aa-9bcf-611dc5c01c38'::uuid),  -- GD NETTOYAGE MULTISERVICES
  ('2494498b-3317-4713-8c70-e469e29b9086'::uuid),  -- GD PISCINES ET RENOVATIONS
  ('2b241991-77b8-4bf4-a6e6-8caf53ccabe0'::uuid),  -- GF MULTISERVICE
  ('d8a531a9-6870-464e-91d2-d0ef0910d44a'::uuid),  -- GFC RENOVATION
  ('24fe7423-5cfa-4e8c-b97f-69a782be35e6'::uuid),  -- GH RENOVATION
  ('ada5846c-bba1-4223-adc5-74723ce0f558'::uuid),  -- GIBOUT MULTISERVICES
  ('48dcf70d-dbd2-44cc-bd11-40e79828a994'::uuid),  -- GIRAUD RENOVATION
  ('9b367877-38ea-447d-af0d-03802cab592c'::uuid),  -- GIS RENOVE
  ('34c9b11d-8c46-47dc-9404-452f3acc1ae6'::uuid),  -- GL MULTI-SERVICES
  ('67b2c1d9-1038-4c2e-bbae-06ae45810e40'::uuid),  -- GLAZ MULTI-SERVICES
  ('d5645e0b-c41f-4237-a0b6-1e42490c2d0d'::uuid),  -- GLENDESON RENOV' MAISON
  ('b7cf5bf9-b561-4a2a-90cb-fd69e6acbffe'::uuid),  -- GLOBAL RENOVATION
  ('ef9fb483-e975-4ab5-8a41-8b80ef73af93'::uuid),  -- GMP MULTISERVICES
  ('e8a0ad9f-79cf-44d2-b134-f105c106fdbf'::uuid),  -- GOOD RENOVATION
  ('82bb4f49-f503-442c-90b7-32d3d82a6fec'::uuid),  -- GREGOIRE MULTI-SERVICES
  ('efc1882a-9273-4ad4-bc7d-24942997ad37'::uuid),  -- GROZEA RENOVATION
  ('cfcdcbfd-0e87-4f44-88c0-e81ba38714bf'::uuid),  -- GSM MULTI-SERVICES
  ('8a9761a5-6ab6-4ada-8b5f-a75767f3859f'::uuid),  -- GSP RENOV
  ('33b839ce-859a-4243-91f7-382b126322ff'::uuid),  -- GT RENOVATION
  ('66007efa-df13-40be-8944-0949f0183813'::uuid),  -- GTV RENOVATION
  ('78cfa557-d982-4e12-a658-21cd79d03c6d'::uuid),  -- GUILHEM MULTI-SERVICES
  ('8ac71251-5362-40b1-b3c5-27791b8a29fd'::uuid),  -- GVS RENOV'
  ('3c6cc197-c677-4a86-94eb-0b26dd199169'::uuid),  -- GZ RENOVATION
  ('2589fbaa-12e9-41c4-ba21-ff4ea2c8884c'::uuid),  -- H. RENOVATION
  ('a843e327-6dc1-471b-bca0-f866322c191d'::uuid),  -- H2B RENOV
  ('d545adc4-e0c1-4ae2-9c1a-39ed0bc8dba9'::uuid),  -- HAR RENOVATION
  ('74bb281d-7470-4af7-8d80-f37e45d4cef5'::uuid),  -- HAUBERT MULTISERVICES
  ('1b1dc980-9f4c-459c-b498-1429c7db2542'::uuid),  -- HBL RENOVATION CENTRE FRANCE
  ('7c3df140-05d4-42ad-aab6-85a0f872f3bb'::uuid),  -- HCL RENOV
  ('13efa42a-ab80-4dcc-a55a-237e610826fb'::uuid),  -- HD MULTISERVICES
  ('a5899555-2320-415c-9c59-bb179b038eb9'::uuid),  -- HD RENOV
  ('4eb2bd1f-74e2-4e7f-970f-23775c66a040'::uuid),  -- HDS MULTI SERVICES
  ('c1de48c7-b3e0-4062-b4c9-0ce0bca8f7a8'::uuid),  -- HEREQI RENOV
  ('0cfdb5c2-633e-42e6-add0-5c698dd6aa3c'::uuid),  -- HF RENOV
  ('fe4d0285-2aca-4dc6-aa0b-8fe76745aa21'::uuid),  -- HK RENOV
  ('96b5bdc6-4367-4f2c-8734-25d21a893184'::uuid),  -- HK RENOVATION MULTISERVICES
  ('72dd7bbe-f508-481e-b643-114b0b8f6db9'::uuid),  -- HKL RENOVE
  ('18ba5161-f96c-405a-a976-45b2a2d5dece'::uuid),  -- HM MULTI-SERVICES
  ('96ff9e50-db7e-42af-b515-79729dd61ae5'::uuid),  -- HM RENOV 14
  ('e8c11f7c-3cfd-4fb4-a3ad-0e8120828cdb'::uuid),  -- HOMEGA RENOVATION
  ('38e5be4d-aba8-4811-8534-73d952621567'::uuid),  -- HOMMULTISERVICES
  ('b32ea2e5-adf0-4f6a-bec3-7b6f9299a074'::uuid),  -- HR RENOVATION
  ('34171560-dddd-4fb3-a4b9-6bfc6bb4ffd5'::uuid),  -- HRC HOME RENOVATION & CHARGING
  ('a0c589f2-055c-4758-a949-a5ed66f9ff82'::uuid),  -- HUGO RENOVATION
  ('08c22ed4-e967-4b1c-b0e5-aaef29109f71'::uuid),  -- I.S RENOV
  ('0202e28a-03a0-4069-b528-9c2bcc11f86a'::uuid),  -- IB RENOV 14
  ('937109df-218e-4e01-b3aa-dae26c380813'::uuid),  -- IDEAL RENOV COMMERCE
  ('cb4df35a-48f5-4dcd-a2c7-b4f13b71a143'::uuid),  -- ILIAN RENOVATION
  ('3dcbee90-f9be-474d-92bf-8697e978a254'::uuid),  -- IMPULSE RENOVATION
  ('80320d26-2e59-4d6a-9840-af96d2e9fa2a'::uuid),  -- IMS.MULTISERVICES01
  ('dc14a2d5-a9e3-4a85-9c34-41f9a121a087'::uuid),  -- INDIANA RENOVATION
  ('ead6d4af-4961-42bf-9da1-5bc8144f2a91'::uuid),  -- INNOV RENOV
  ('ddd529b0-724b-4e44-852a-16bfc9a4ccf6'::uuid),  -- IROISE ABER MULTISERVICES
  ('963cb9cb-f60b-4ea0-8400-b3159dde8a06'::uuid),  -- J MULTISERVICES
  ('0a565ddc-66d2-4174-88f9-0ab8f65b5ac0'::uuid),  -- J.A.MULTI-SERVICES
  ('50c2e642-5ade-4530-bff2-98413a30e29a'::uuid),  -- J.O RENOVATION ET CONSTRUCTION
  ('57bad070-fdfa-43ab-ae2c-6f9d0147e09f'::uuid),  -- J.S MULTI SERVICES
  ('457d712f-6ab2-4f16-9d0b-9b02a00b2aa8'::uuid),  -- JACQUES MATHOUILLOT MULTI TRAVAUX DE RENOVATION DU BATIMENT
  ('652a3322-2c20-43af-ac32-190182b6ec45'::uuid),  -- JACQUIER MULTI SERVICES
  ('e0b10d34-9952-417b-8470-9739d08d4933'::uuid),  -- JAWAD CONSTRUCTION RENOVATION
  ('8131fcd0-3f94-48f8-8f8a-63e64c099b65'::uuid),  -- JC MULTISERVICES
  ('c0e1ad71-d742-4ebc-a06c-b884f1196c9d'::uuid),  -- JC RENOV80
  ('c6c6959c-fa1d-444e-a725-3ca268606d66'::uuid),  -- JC RENOVATION
  ('b220d521-5449-420a-bbaf-811d73faa8c1'::uuid),  -- JC SUD RENOVATION
  ('f13ebc18-1986-4638-8e01-0d7aaffd0eba'::uuid),  -- JC2B MULTI-SERVICES
  ('54d689a2-5a37-47e1-ac0d-47bd390d6baa'::uuid),  -- JCR RENOV & SERVICES
  ('73252b16-b836-4d03-b64e-e42cc776bff6'::uuid),  -- JD RENOVATION
  ('b567775c-910f-41ea-b10b-5466b24e907f'::uuid),  -- JDC RENOVE
  ('0b031f7f-fab0-43d9-8a36-19fa49c64095'::uuid),  -- JDS-MULTISERVICES
  ('92729c92-a34c-4a1d-aa86-9ca8fa40e8f6'::uuid),  -- JEAN REPARE MULTISERVICES
  ('838eb096-333c-4619-8388-06e6461cde4c'::uuid),  -- JEM RENOV
  ('a2fbe879-d944-4839-838c-b0ddd099464c'::uuid),  -- JEREM RENOV
  ('afa999a5-ebac-47ee-84c1-252194bef747'::uuid),  -- JF MULTISERVICES
  ('46d4d8e1-998e-49e6-9ec3-7abb34bef388'::uuid),  -- JGMULTISERVICES
  ('ffd0fd11-f16f-48d5-86d2-1bc3c425e11f'::uuid),  -- JIM RENOV
  ('80c2c05d-bd35-4fa0-9c69-7b98838ad111'::uuid),  -- JK MULTI-SERVICE
  ('a7a7453f-4aef-4a12-aa7f-295dd3f36cde'::uuid),  -- JL MULTISERVICES
  ('fa04ced1-458e-4412-abea-919aadacddc2'::uuid),  -- JL RENOV 56
  ('73e9d8d5-f87e-4c8e-aa61-85325dc7afa3'::uuid),  -- JM MULTISERVICES
  ('ab8efb1e-e36e-4cf7-9136-0a405cd7ae81'::uuid),  -- JM RENOVATION
  ('9e5e0336-facb-42e0-9684-b8b7d0d1259a'::uuid),  -- JM04 MULTISERVICE
  ('f424fdb0-3274-46bb-a9b6-f14d77a2b332'::uuid),  -- JMS MULTISERVICES
  ('34aba9ec-af82-40e6-92d4-188f73202a15'::uuid),  -- JO ' RENOVE
  ('3b810fbd-c24d-4bd5-8a9a-e8814323aa68'::uuid),  -- JOHAN MULTI SERVICES
  ('8f74e6b4-40ae-49f3-bbd5-6023e4a3a5e2'::uuid),  -- JOHN-RENOV-BAT
  ('d5aff407-c622-46a1-96ab-a17e315a6ff5'::uuid),  -- JP MULTISERVICES
  ('36400236-de5b-475e-8e02-45e4adf87dc4'::uuid),  -- JSO RENOVATION
  ('d915aeb2-e047-4d0a-a8cc-0bf50618f973'::uuid),  -- JT RENOVATIONS
  ('82aafa5e-c078-4420-a628-c9b620892a55'::uuid),  -- JTT RENOVATION
  ('ab0eede0-b3de-466b-adf7-bba68de66d55'::uuid),  -- JU PROJET RENOVATION
  ('5dcb20c3-bf75-459b-8c0e-9aba044091fa'::uuid),  -- JULIEN RENOVATION ET NETTOYAGE
  ('ba6421a1-a59a-46be-b183-8e24b8ad0f5b'::uuid),  -- K'SUR RENOVATION
  ('edd38ee6-329c-42b0-a932-e75533c0de43'::uuid),  -- K.G RENOV BAT
  ('9d359003-6bbf-4308-81e0-29c3ab2fa1f2'::uuid),  -- KA MULTISERVICES
  ('1325e2fa-751f-4be1-bac7-eab4bdd5b1ee'::uuid),  -- KAMBERI RENOVATION 14
  ('b5b63bfb-c4c8-4929-8095-3bb8d1b4620a'::uuid),  -- KAZAKH RENOV
  ('ba61ea59-9654-40f0-9c1f-9d70f1df7713'::uuid),  -- KD RENOVATION
  ('b02664e6-37a4-4c00-8ec4-81f729ddc2ef'::uuid),  -- KDB RENOVE
  ('33ffbcd5-ec20-419d-90e7-d5d824fa787a'::uuid),  -- KENLOR RENOVATION
  ('2f85a882-b86a-48c9-aa01-e38b5b76798d'::uuid),  -- KERGADALLAN RENOVATION
  ('0ac37c25-3c47-4cd4-a958-967c80eed300'::uuid),  -- KIWI90MULTISERVICES
  ('c0cfc7c8-186b-49cf-a5de-53de7d67acc1'::uuid),  -- KM MULTI SERVICE
  ('e437856c-51b3-482e-bf2b-dc71add3f986'::uuid),  -- KMULTISERVICES
  ('a905367c-356e-4949-9732-9ddd3275b97b'::uuid),  -- KN MULTI'SERVICES
  ('b341d099-1478-44ea-b08d-ed64044b4975'::uuid),  -- KORP MULTI-SERVICES
  ('f9434c44-85d5-4841-9579-d4bea1d6d56c'::uuid),  -- L AND W MULTISERVICES
  ('80fb3951-8757-4af9-aefb-5072fb1b219b'::uuid),  -- L&D' RENOVATION
  ('89abf532-3560-4fe5-8ce0-f53177fc5c34'::uuid),  -- L'RENOVE
  ('b73f31b3-3033-4385-87c1-97ced06fff0f'::uuid),  -- L.A RENOVATION MARNAISE
  ('b2ee4cbe-76da-4fef-bfe6-c1fe18bc1748'::uuid),  -- L.M RENOVATION
  ('7397fcfe-87b3-4242-81a0-17fdadf390ef'::uuid),  -- L.RENOV
  ('530e31fc-a5a0-4e3b-a26c-a0d9c9defe81'::uuid),  -- L.V. RENOVATION
  ('e76dcbc3-7a67-4613-8031-b057200a2333'::uuid),  -- LA TEAM RENOV'
  ('44e88d4e-1729-4ee5-a63e-436cb85d9479'::uuid),  -- LABO RENOV
  ('ebc5922d-7823-4a63-ba15-86dac096b95d'::uuid),  -- LANDES RENOV'
  ('918cb4fc-19e1-4489-9ae5-080ebd3c1c67'::uuid),  -- LAPAL RENOV & FINITION
  ('1ab5f2ac-0928-401f-a164-bf6e8d3cc82d'::uuid),  -- LC MULTISERVICES
  ('6bfac943-c6b3-4496-b38b-69bfa00e933e'::uuid),  -- LCB RENOV
  ('23fb3438-ce27-411f-8eb1-c45370c47b72'::uuid),  -- LDS RENOV
  ('f0d63505-1b61-4c2b-a962-0ed7f824dd41'::uuid),  -- LEGAIN RENOV
  ('fc0e91e7-c5d8-4da2-8871-0fea9a53f1da'::uuid),  -- LEGEAI RENOV'
  ('1ddb7e17-2914-457d-9634-1c7950546187'::uuid),  -- LELIEVRE MULTISERVICES
  ('60acb803-d55f-46e2-8ec9-aed1ee4ddfbe'::uuid),  -- LEONARDIS RENOVATION
  ('0ee7196b-7169-430b-87f3-f0725230a86d'::uuid),  -- LEVACHER RENOVATION
  ('04f20769-9a61-4979-8627-409a032fe230'::uuid),  -- LG RENOV
  ('bf221d1a-670a-476f-828e-d39d0d4a21d3'::uuid),  -- LHERMET CREA-RENOV
  ('84469ad9-de2a-4d6e-8c62-5ec795e27e1c'::uuid),  -- LJ RENOV 86
  ('1237bf6a-6c65-406d-91e9-dced8b274872'::uuid),  -- LJC RENOV
  ('b7b70e47-2d85-4084-8815-45c7e224bec1'::uuid),  -- LM RENOV
  ('c109c577-9dc6-44a8-afc8-ad95121b4bc3'::uuid),  -- LM RENOV
  ('4c1f6ce7-8580-40cd-9671-a401ae68bd5b'::uuid),  -- LM RENOVATION
  ('e681a0be-8315-4a84-b9b5-f4f3886b5fa3'::uuid),  -- LMS LEPOUTRE MULTI SERVICES
  ('cb4379cf-7cd1-4381-9b59-beb046329b17'::uuid),  -- LOON RENOV
  ('934fa4a8-a781-4df9-9fc1-a055d9b9c63c'::uuid),  -- LPJ MULTI-SERVICES
  ('db4954c7-0df4-4130-935d-6152fbc516a5'::uuid),  -- LR MULTI-SERVICES
  ('533536cf-fc8e-4ffe-884c-84a864b1a9a6'::uuid),  -- LRC AMENAGEMENT & RENOVATION
  ('80890a5d-1df9-4975-a49d-69b568d1c000'::uuid),  -- LS MULTISERVICES
  ('a70dcdeb-c7cc-403a-9900-0cf0f601b48d'::uuid),  -- LS MULTISERVICES
  ('fab1e40b-e846-4a9d-bfd1-e396cd8d379e'::uuid),  -- LS PRESTA'RENOV
  ('d52191ea-211a-4ef5-9d29-5b274d317818'::uuid),  -- LS RENOV'
  ('0eb1dcc2-5fcd-497f-938e-5a74231840ae'::uuid),  -- LUCIA RENOV
  ('2a0ab42a-c025-48a7-b4e0-6020c67f36e0'::uuid),  -- LUDO MULTI SERVICES
  ('61a4fdc2-70b4-4b9b-af20-e587e6dd526d'::uuid),  -- LUDO'RENOV
  ('4af4894e-dc35-43b3-941d-c50c9599858f'::uuid),  -- LUX RENOV
  ('112548b2-150e-4939-b0aa-40cef94bf264'::uuid),  -- M ECO RENOV
  ('a61f21df-fe25-47ba-a53a-67cfb1a7a181'::uuid),  -- M MULTI-SERVICES 73
  ('4e0bf4a1-321e-4263-bb6c-fa1f74625e99'::uuid),  -- M P RENOVATION
  ('35167a62-f83b-46f6-be72-f1a7b75e20f6'::uuid),  -- M RENOV
  ('13735ec9-137b-4c2d-bbbc-3fa4c7aadad7'::uuid),  -- M RENOVATION
  ('f31abb68-43b2-4743-9286-ac276d3b2d9a'::uuid),  -- M' MULTISERVICES
  ('9048fa80-32dd-4664-94be-494215736f8f'::uuid),  -- M.A DECO RENOVATION
  ('34ea9aca-0627-4fe8-9aef-b134e465f5f5'::uuid),  -- M.C MULTISERVICES
  ('c26fb3c0-13c8-4e6c-af2f-71de3b45c8d1'::uuid),  -- M.C.V. RENOVATION
  ('aebfc374-3712-4278-bd73-6e2958b090bd'::uuid),  -- M.H RENOV
  ('306636ce-6fae-42d8-acfe-96f0ef960931'::uuid),  -- M.MOS RENOVATION PRESTIGE
  ('e3e2a2de-4f47-4818-97c3-ca7e27a3c197'::uuid),  -- M.S.L MULTI-SERVICES LEZATOIS
  ('28a1f9de-8280-4484-bad2-b48003b709cb'::uuid),  -- M.V MULTI-SERVICES TRAVAUX DE L'HABITAT
  ('e655e641-ba93-4949-981b-b5ed53b48e0b'::uuid),  -- M2A RENOV
  ('72adbff4-6150-497d-97b1-7a417cd79552'::uuid),  -- MA RENOV'
  ('97744aac-241b-4dab-95bb-cad46da7d0df'::uuid),  -- MACKY RENOVATION 7
  ('0e54976b-7f25-42ca-8a59-0a16a9788f06'::uuid),  -- MAIN VERTE MULTI SERVICE
  ('7a5d87e6-9335-43e0-9c62-e07f03bc0e24'::uuid),  -- MAISON D'ARTISANS RENOVATION
  ('9ef69ce7-6702-4efa-8d47-f37eecf7018d'::uuid),  -- MALOUINE RENOVATION
  ('a38f7192-4332-4423-82a2-80fa9ae98e5c'::uuid),  -- MANU RENOVATION
  ('aa67a515-fd97-46dc-9116-b8a8fad982a2'::uuid),  -- MARTIN RENOVATION
  ('a43c3919-795c-4a2d-8905-bc0187df60c1'::uuid),  -- MATTEI MULTI SERVICES
  ('15c9d98e-d407-43fb-ac4d-ffca7bd0d96b'::uuid),  -- MAXWELL RENOVATIONS
  ('72a970b5-31d5-4c61-8739-6c3715be904b'::uuid),  -- MAZEL RENOVATION
  ('2a77d00a-c3bd-4748-ad67-5febfa810d4b'::uuid),  -- MB MULTI SERVICES
  ('dc29ebaa-2f54-410d-aca2-c0e87172bcff'::uuid),  -- MB RENOVATION
  ('3bee9a04-d76f-4837-bd80-a6f87ddc8af7'::uuid),  -- MCF MULTISERVICES
  ('eb7e70c5-bbef-4c12-9f07-6e08a4f35af6'::uuid),  -- MCM RENOVATION
  ('75234995-2529-469e-ae2d-c9ec7d60be7a'::uuid),  -- MDA RENOV
  ('a5803f24-c839-474c-a342-6f244ce0f2c6'::uuid),  -- MDAL-RENOV
  ('256799aa-43d2-4fd8-9e14-3da2cccfc85b'::uuid),  -- MDS RENOV
  ('fa6a2df7-ffe5-4e45-8791-829fb8d52301'::uuid),  -- MEDEIROS RENOVATION
  ('e40de146-2543-4c64-884a-17464c752cec'::uuid),  -- MELIANE RENOVATION
  ('54312947-d70d-4e6d-84da-6a7ee8297ecd'::uuid),  -- MEYER - NETTOYAGE & RENOVATION
  ('f05985b3-b884-4556-9f37-4744fc9fca56'::uuid),  -- MF ECOBICI RENOVATION
  ('6a1cb9ae-ff42-470a-a3b5-896dec79a01a'::uuid),  -- MF.RENOV
  ('d59a9834-55ac-437c-9a36-20fea36476f6'::uuid),  -- MG MULTISERVICES EXPRESS
  ('b110b871-0a02-444f-9532-47a69b6db6b4'::uuid),  -- MG RENOV
  ('07e93f00-0e2c-4799-89b8-f9d9bbd4dcc6'::uuid),  -- MG RENOVATION INTERIEURE
  ('895eaa34-8011-46e0-897b-e32392375c89'::uuid),  -- MH MULTISERVICES
  ('c5e5634e-0bc4-4d89-991b-5eea4876a8be'::uuid),  -- MICHEL RENOVATION
  ('62b63fbf-7ee7-47bc-9178-ec3613fae441'::uuid),  -- MIG MULTI SERVICES
  ('95696334-3d95-4316-966d-b4c64a129ba7'::uuid),  -- MIHAI RENOVATION
  ('9b3bc916-c7b1-4d64-8506-705189e13a44'::uuid),  -- MIMI RENOV'
  ('6090d158-eeb6-4bbf-bd6d-e9d9a49c4487'::uuid),  -- MJ RENOV
  ('0bce6f5a-4363-4a7c-8c89-dffcd5479870'::uuid),  -- MJ RENOVATION
  ('e9b2d638-2102-46d4-a50e-299d41ac4afe'::uuid),  -- MJN RENOV
  ('2be46890-9ce8-4933-8106-98ca36cb67b4'::uuid),  -- MK MULTI SERVICES
  ('2f69ac32-cdbf-4ae1-b197-ad0d49d6db57'::uuid),  -- MK RENOVATION
  ('585d93a4-cc47-45ce-8fa0-91ebf851e6c9'::uuid),  -- ML RENOV 92
  ('99dbf29a-3c35-40ac-866b-e24cd65e6493'::uuid),  -- MLR RENOV
  ('1cb59d15-42be-426d-a766-0a2a66c552fd'::uuid),  -- MLZ MULTISERVICES
  ('b58afbd6-86aa-4db4-b75e-2a25d95f6bec'::uuid),  -- MONTAGNE MULTISERVICES
  ('38773034-d583-46cc-8495-fe3d1bcbd89d'::uuid),  -- MONTS MULTISERVICES
  ('b32cce58-dbae-4276-92da-b0619c55789f'::uuid),  -- MOOD RENOVATION
  ('31ec4817-d2df-47db-8f98-14402028c759'::uuid),  -- MORELLINI RENOV
  ('52d67c65-4fbf-4289-8409-837e29fe1655'::uuid),  -- MORIN MULTISERVICES
  ('2a1699a0-7787-4a79-83a4-c7bf591ef3ef'::uuid),  -- MORINA RENOVATION
  ('2e49d153-1715-4c42-8640-499b627a00b0'::uuid),  -- MOUTONS & CO MULTI SERVICES
  ('3a1fe192-b35a-49bf-9a64-ff02d1b7e9e4'::uuid),  -- MPA RENOVATION
  ('bbdc5172-6712-4202-8570-d67b2c277c43'::uuid),  -- MR. D. HOME RENOVATION
  ('23043202-3556-484e-8018-36ce06379584'::uuid),  -- MRB RENOV
  ('eac62112-be87-482d-ab51-c14a003853af'::uuid),  -- MRF RENOVATION
  ('b7880067-100f-4078-b9be-5c97c51d0c7a'::uuid),  -- MS MULTISERVICE
  ('79203e9c-6102-4859-b9a7-8df344c53279'::uuid),  -- MS RENOV ACTIONS
  ('fbd2bcd4-f570-4360-a490-38c651250086'::uuid),  -- MS RENOVATION
  ('83aaaa23-5115-4a8e-8b06-57163f8d7d77'::uuid),  -- MSP RENOV
  ('ef7aaa79-6290-4a25-8f4a-f454cbe70567'::uuid),  -- MULTI RENOV
  ('cfe9c69e-3c49-4390-a67c-b98cb79e1b01'::uuid),  -- MULTI RENOVATION 17
  ('547b1d70-76de-46f2-9b39-f3b155b70068'::uuid),  -- MULTI SERVICE
  ('8ff7a33f-58f8-4ff7-b7df-515d9d483d03'::uuid),  -- MULTI SERVICE
  ('b5fa5143-ef6b-479e-8464-3a5757715dc1'::uuid),  -- MULTI SERVICE
  ('7286e8c5-6679-4133-af43-8fd38d17e200'::uuid),  -- MULTI SERVICE BATIMENT
  ('3c0934d9-99fe-42d8-b664-301243206df1'::uuid),  -- MULTI SERVICES
  ('47f6cc04-6106-4b9c-965f-b0bd52bbfe6d'::uuid),  -- MULTI SERVICES 2V 2B
  ('c38fc719-aba3-4495-ba91-ddcef229ce7c'::uuid),  -- MULTI SERVICES 74
  ('365694bc-b873-4b44-9252-5fd2c34607ed'::uuid),  -- MULTI SERVICES CONSEILS RENOVATION
  ('ad752bf0-b1ff-4ae7-bd86-b13b70c1b204'::uuid),  -- MULTI SERVICES M.RAGON
  ('1c37275d-925f-4269-89b8-aff15ba2ec4b'::uuid),  -- MULTI-SERVICE 64
  ('d324c322-7728-4a46-a7f9-92d51ac8a253'::uuid),  -- MULTI-SERVICES PRO
  ('3fab6b7d-83b3-4ebc-8554-0b16c5ab0645'::uuid),  -- MULTISERVICE AUDE
  ('135b7b6c-e4ac-4207-a9f1-b6f6876f63e1'::uuid),  -- MULTISERVICE&CAMILO
  ('1ca7d004-f6f8-443d-a623-1e9e6ebfbecc'::uuid),  -- MULTISERVICES
  ('f618c4a5-7a0f-4180-904c-8e932ef0ac2f'::uuid),  -- MULTISERVICES 08
  ('9cd30456-8423-4b1e-9bfb-1cfd6fbcf867'::uuid),  -- MULTISERVICES 73/74
  ('507696f7-92a8-49af-b9fc-99ecac7f8717'::uuid),  -- MULTISERVICES 8995
  ('5a35499c-ce95-499f-8ee3-9cba9f8efe5e'::uuid),  -- MULTISERVICES AND BRICOLAGE
  ('5e75c2c6-7f9b-4a99-bb34-46d92336806b'::uuid),  -- MULTISERVICES BTP
  ('dc2f8785-5335-4737-96db-7d0ec5e661cb'::uuid),  -- MULTISERVICES CENTRE
  ('11c224bf-d5e2-47af-8bb1-13b3bca0158b'::uuid),  -- MULTISERVICES CHAMPENOIS
  ('68ef252c-7a14-44ee-bc9d-0063a7d47dba'::uuid),  -- MULTISERVICES DU BATIMENT
  ('5d9f5eff-2449-4907-a09e-5505e5bd06a2'::uuid),  -- MULTISERVICES FAB 82
  ('44ab3db7-2768-4bd7-ad63-b08c61a703f9'::uuid),  -- MULTISERVICES GARGOWITZ
  ('e0d264d4-260d-452c-bcd0-bc0e2ee6ffd8'::uuid),  -- MULTISERVICES HRL
  ('d63da37c-e3b2-4261-bd5f-fccc62539956'::uuid),  -- MULTISERVICES MONNERAUD
  ('21f79103-4173-40e7-98fb-f4c085ff0bc6'::uuid),  -- MULTISERVICES VINCENT
  ('d7b83039-e01e-4a3c-b111-09aed85ad659'::uuid),  -- MULTISERVICES Y
  ('a2714028-3f2e-481c-9025-0b44bf08b454'::uuid),  -- MULTISERVICES11100
  ('2d759d5c-fc63-4616-964a-5ade08c21fce'::uuid),  -- MULTISERVICES2B
  ('49298a19-d58e-4c91-9f31-5a43a2ef6478'::uuid),  -- MV RENOVATION
  ('901716af-92e8-4a4c-8dc4-0c828083604b'::uuid),  -- NATAEL MULTI SERVICE
  ('c10b198f-938c-4b8a-be9b-fa5530c16516'::uuid),  -- NATIONAL JOULE RENOV
  ('fe454e21-4887-4941-a8af-93b7d6924188'::uuid),  -- NATIONAL JOULE RENOV
  ('ca1a9fe6-c517-4826-bd27-03933afdf3f9'::uuid),  -- NATOLI RENOVE
  ('5dac2a68-a866-41d7-8fd2-833ccd8ba4be'::uuid),  -- ND RENOV
  ('7d071ed7-def7-47f5-b34d-284ac3aee2d9'::uuid),  -- NELLI&DAVID RENOV
  ('30a49b70-e69a-4bfc-a3a5-49c0146c7b06'::uuid),  -- NET TOIT RENOV
  ('8341e8e7-587a-485d-9a29-eeb78ff98db8'::uuid),  -- NGP RENOV
  ('4575b991-c6b9-4624-b3ac-8ba8b90b53f4'::uuid),  -- NICO MULTI-SERVICES
  ('b268e6bf-fc02-4ed0-a648-7371f2061331'::uuid),  -- NICO MULTISERVICES 64/40
  ('00d2a21a-24ea-45ae-9c6f-086f89f5987a'::uuid),  -- NICOMULTISERVICES
  ('b874f90d-6a07-4103-b2b2-d396c9dcaa7d'::uuid),  -- NIKO MULTISERVICES
  ('3cf9d7d7-af6c-4e66-8a54-c1a915100bbd'::uuid),  -- NJP BATIMENT / RENOVATION
  ('5ce6e938-4d5a-45ab-b33f-4b8463391b94'::uuid),  -- NOEL MULTI SERVICES
  ('3b19e898-5908-4d7a-9e93-7e54d569ba7a'::uuid),  -- NONO 88 MULTISERVICES
  ('5f5cdb90-92e7-4b9f-887a-f7322303bbae'::uuid),  -- NP MULTISERVICES
  ('3cfe8e82-54c5-454f-b82b-6194933e9aea'::uuid),  -- NPT RENOVATION
  ('d960e2bd-82b1-4be3-8f3a-6cea83403d0b'::uuid),  -- O K MULTISERVICES
  ('7c78ecb1-869b-4696-b179-6302e992bf83'::uuid),  -- O.M. RENOV E.I.
  ('c69221e6-03ee-4331-9557-1dc73c211166'::uuid),  -- O2 RENOV
  ('58797547-631c-452c-9709-70e549764c97'::uuid),  -- OBJECTIF MULTI SERVICES
  ('b834e7b7-c92c-4741-818b-a262923d68ba'::uuid),  -- OIMS RENOVATION
  ('c42ead0e-40fe-47d5-8f40-36020337fbac'::uuid),  -- ORIENTE MULTISERVICE EXTERIEUR
  ('fe3527b7-c310-45c3-8d38-2be772ab3bff'::uuid),  -- OZPINAR RENOVATION
  ('b0623c70-a634-49f7-9d0b-fe1dbf35b566'::uuid),  -- P.A. MULTISERVICES
  ('24fcf20a-3df2-4805-a024-01c312c43edb'::uuid),  -- P.S MULTISERVICES
  ('d4283740-562c-44df-be89-bfd51e3c9809'::uuid),  -- PAPY J-J MULTI SERVICES
  ('45d9624b-aa62-4fdf-8e82-1cfb7ab4db9c'::uuid),  -- PAT' MULTISERVICES
  ('a732eb34-7da7-4b4f-915d-5106b170462a'::uuid),  -- PAT'RENOV
  ('d5b12a98-1790-4cd9-8d0c-16fbab0db3a1'::uuid),  -- PDN RENOV
  ('7236a817-2e72-40fb-9aa3-05cdb3b64b56'::uuid),  -- PEP'S MULTISERVICES
  ('ee5b6798-0d12-474f-b9cd-774502bec9a5'::uuid),  -- PERSPECTIVE RENOVATION
  ('923b9658-b9d7-49e6-b7b6-e35c96992417'::uuid),  -- PETIT CHRISTOPHE MULTISERVICE
  ('0fe12f9d-83e1-44b6-9c75-dc3a66610a4f'::uuid),  -- PG MULTI-SERVICES
  ('89401b82-f263-4a58-a593-2c27aa6bd321'::uuid),  -- PH RENOV
  ('cabedff1-ec8d-4fe0-b3b6-6af106f73755'::uuid),  -- PH RENOVATION
  ('198ae2f6-30c6-4f47-a95e-d1bde7f1b316'::uuid),  -- PHIL MULTISERVICES 87
  ('9bc1593f-d86e-4948-940f-c9fa1ad66c69'::uuid),  -- PHT RENOVATION
  ('ccbb4c68-8a7d-46af-985f-442863cfc9ea'::uuid),  -- PIERRE & FILS RENOVATION
  ('8a101d3b-de4f-43db-8366-f59aae67e3aa'::uuid),  -- PIERRE BALL RENOVATION
  ('24ac89bf-5a6f-4f84-b81c-4c24b0024bcf'::uuid),  -- PJ MULTI-SERVICES
  ('57888333-a749-4255-b022-1dae1772f279'::uuid),  -- PLAC'OZPINAR RENOVATION
  ('2b9ff531-1fa0-4c4a-91e6-f99f96663962'::uuid),  -- PLG RENOVATION
  ('8a72ceaa-95ad-46fd-9a18-7fc0c039b8c1'::uuid),  -- POLE RENOV
  ('6207a9c1-9bd2-4de2-bed5-4ad26d28ac96'::uuid),  -- POLY RENOV' BY ALTA
  ('8a0141c3-31a3-48d5-b66a-1dbdddff801b'::uuid),  -- PRO G RENOV'
  ('b1f44ddd-e870-4479-87d3-de956dc9f49e'::uuid),  -- PROJETS MULTISERVICES
  ('93551da4-123f-4249-8d67-3ef570ea9a32'::uuid),  -- PS HOME RENOV
  ('b2b60b7d-88a3-4451-a9b4-6f60a4ef9c69'::uuid),  -- PSM RENOVATION
  ('ee5a8912-d813-4f69-87d0-7cc510f46b26'::uuid),  -- QUIMPER MULTI SERVICES
  ('231aa533-5853-4c46-b89e-fd9454d6905b'::uuid),  -- R. MULTI-SERVICES
  ('d052d5d6-3fc6-4b15-aacd-6073014d4487'::uuid),  -- R.C RENOV'TOUS TRAVAUX
  ('26fbcd3d-b1fa-4678-9455-01a900940764'::uuid),  -- R.S MULTISERVICES
  ('f25daf7a-459b-4e0d-8f14-336b3cf7ebfc'::uuid),  -- RAD-RENOV
  ('3aa06efe-ac3f-48d2-93b9-f176bbaeff30'::uuid),  -- RAL RENOV
  ('95588899-e365-4e41-b6d2-44f5919ad3aa'::uuid),  -- RAPH MULTI-SERVICES
  ('df08b178-6efc-415a-904d-849ce08610e4'::uuid),  -- RC MULTI-SERVICES
  ('db292424-dd10-40eb-be91-eff3a86dc370'::uuid),  -- RC RENOVATION
  ('df731386-9b6d-41db-ac13-f93cf13a0541'::uuid),  -- RD MULTISERVICES
  ('ad421f08-65da-4181-9278-08d9001c59a5'::uuid),  -- REALISE ET RENOVE
  ('7e65149b-6f33-4b31-95e2-5ea7d2c059be'::uuid),  -- REGIS ODENT MULTISERVICES BATIMENT
  ('da25a8ba-f5af-4457-aa1a-4ef6c1bc13b1'::uuid),  -- REMY ALBOUY MULTISERVICES
  ('0762246b-60b3-428a-83bc-1e6e99372445'::uuid),  -- RENAISSANCE RENOVATION
  ('5107bf87-0c74-4796-b27d-7755e2ceeb23'::uuid),  -- RENAUD MULTISERVICES
  ('d16bdfc5-f0df-41bd-9166-3d151f546829'::uuid),  -- RENOV & CO
  ('b44706f8-a5d1-4714-a561-7467199ec1c2'::uuid),  -- RENOV & CONFORT
  ('8737724e-bf3c-41c5-bfab-967fb5119225'::uuid),  -- RENOV ' SERVICES - MONSIEUR POFILET BERNARD
  ('ade991af-6758-4631-aab3-374a65146244'::uuid),  -- RENOV - ACTION
  ('59559511-03dc-4926-b376-cd4d210c5cd5'::uuid),  -- RENOV BAT
  ('754af1cb-0b2d-47bc-beb1-72d79b316167'::uuid),  -- RENOV CONCEPT
  ('23e5b5c6-37b1-451c-ab3b-fde44df0c3cd'::uuid),  -- RENOV CONSTRUCT
  ('2e3c8e4d-1c61-4904-b7bf-f602ddbdc758'::uuid),  -- RENOV EB
  ('9e4bebd7-9388-44a9-932b-9c88dd36023b'::uuid),  -- RENOV ECO
  ('51fc3e59-0905-4442-9f80-6acdef8d0588'::uuid),  -- RENOV ET CREATION
  ('9c3e8876-ca08-4398-93a9-8ff255b06fa4'::uuid),  -- RENOV ET CREATION 64
  ('88e8916b-c86d-407b-8224-2786ea4229d9'::uuid),  -- RENOV HABITAT 78
  ('b8e1c55b-8c70-44b4-8bd4-f314975cd69d'::uuid),  -- RENOV PLUS
  ('c189bd29-5030-4869-80ea-e50ac23d67ab'::uuid),  -- RENOV PLUS
  ('3c27af72-d462-402b-b1ae-c754ae3d384f'::uuid),  -- RENOV PRO FAHD
  ('268bd612-367f-4b92-aff3-51e0a99ec736'::uuid),  -- RENOV PROTECT
  ('c745412c-8bce-4408-9235-fe4cfee94a84'::uuid),  -- RENOV SERVICES 42
  ('dedce5d3-95f6-4c0b-8ca7-1984ca1f79a2'::uuid),  -- RENOV TOUT
  ('5ddc9a9c-17ab-40c5-98d5-4ae268224eaf'::uuid),  -- RENOV&LA
  ('ecd4d28e-8806-404a-b0eb-6893b8212956'::uuid),  -- RENOV' ACTION
  ('72e21dd6-4dbf-4fd2-83c5-a01cf68d76c1'::uuid),  -- RENOV' AT EURE
  ('2390aa4f-77b5-459f-bb78-d307abe25df9'::uuid),  -- RENOV' BAT PYRENEES
  ('f43eed4a-00a3-484d-89e9-4a501a487889'::uuid),  -- RENOV'& VOUS
  ('f99ed8a2-3eca-464a-9d91-dfc29479dc9e'::uuid),  -- RENOV'ACTION
  ('970ac1ba-86f1-46a1-a35d-3b7e41753c85'::uuid),  -- RENOV'ALPINE
  ('37a68858-7a04-4f3d-a798-92fbd17244c9'::uuid),  -- RENOV'ART
  ('62eb52c7-e177-401a-9403-358e87f127ed'::uuid),  -- RENOV'BOSS
  ('008f995e-86ac-424e-ac62-21a0a6b54fd8'::uuid),  -- RENOV'COMTOIS
  ('be536213-0b62-469e-ac7a-9ec6f7304b61'::uuid),  -- RENOV'HABITATION
  ('0fe80299-68d8-4763-b662-2766ae7a1186'::uuid),  -- RENOV'HOME 18
  ('b6f85382-d88c-4fb6-9339-8731062c1cda'::uuid),  -- RENOV'IMMO
  ('7a5a4d74-b50b-4bc0-8336-d8ddefef1735'::uuid),  -- RENOV'IT
  ('8b0a542f-f8d0-4590-9890-ca39d5aa522c'::uuid),  -- RENOV'SERVICES
  ('647581ed-02b6-4af4-9de8-d84e8a9ebc24'::uuid),  -- RENOV'TO BATIS
  ('4e5e3b89-1114-40a2-a6b7-76810a0f7167'::uuid),  -- RENOV-H
  ('a217b020-a567-4584-bb7f-fbb0d0a54014'::uuid),  -- RENOV.ESTA
  ('06fe9916-2916-4147-b4fc-a767c4becb13'::uuid),  -- RENOVA
  ('7a28156f-aa72-4850-b0d4-a8880c9019fc'::uuid),  -- RENOVA
  ('9662e9e0-95a6-4356-ad32-deb2417626b2'::uuid),  -- RENOVAL +
  ('8c2b2bd0-e0ea-4a81-88b0-72e1baff901a'::uuid),  -- RENOVALHOME
  ('1c73bdc9-caea-4369-b78f-84f3db61f1ea'::uuid),  -- RENOVART
  ('e43dc6a4-7f77-4bef-8608-63ef1ab57c7f'::uuid),  -- RENOVATION  MM
  ('ee1636be-70db-41ab-86ef-e7ea3b922a27'::uuid),  -- RENOVATION BATIMENT DE FRANCE
  ('0c86d4d7-e447-4f3f-8ba7-cb92f3f3f269'::uuid),  -- RENOVATION CREUSE
  ('39e591d0-4d4f-4a8e-846b-2384f1c9edc2'::uuid),  -- RENOVATION INTERIEURE REIMS
  ('3d45ee04-5b60-4538-bb53-eae84b9930f5'::uuid),  -- RENOVATION JB
  ('2eecad48-fc15-4a7d-8aca-125ddd7872d2'::uuid),  -- RENOVATION THUIRINOISE
  ('5c787269-bd87-4910-9500-cf6fe67309cd'::uuid),  -- RENOVATION TOUS TRAVAUX
  ('5f1dfeb7-24f7-4f48-b8c9-13459fa7b58a'::uuid),  -- RENOVATIONS LIMOUSIN
  ('928e8cec-771b-4517-9cbf-07a667e5953e'::uuid),  -- RENOVCASA81
  ('28043649-a1e3-45a4-9c35-1a0c2f9d286f'::uuid),  -- RENOVE POITOU
  ('2d443684-a52b-4e3d-a174-a30d13fb1506'::uuid),  -- RENOVEO
  ('a9ba348f-2e0e-43e7-8381-ca14148880a8'::uuid),  -- RENOVHABITAT-BYLUDO
  ('0f4f2292-d31d-4e3f-80f6-9a28ec40ee38'::uuid),  -- RENOVIA'S
  ('bb805454-ddeb-40b1-b456-183623f9adb5'::uuid),  -- RENOVIT
  ('8aa52594-2b9d-4cbf-ba10-c60f798f5f35'::uuid),  -- RENOVTOUT
  ('e7df01eb-32e4-463f-a738-bc80f0d9071f'::uuid),  -- RENOVTOUT
  ('25185b5a-d056-4297-9a34-61bedca2ef40'::uuid),  -- RENOVYA DESIGN
  ('a0e535dd-b9c8-4cbd-8991-952962c7cdf8'::uuid),  -- REP MULTISERVICE
  ('60cf25fd-e33d-4f2e-b386-fca06bb25263'::uuid),  -- RG RENOV 85
  ('b21ad7ad-6668-4d6b-baca-40bc7045db41'::uuid),  -- RGB MULTISERVICE
  ('834bf89a-8123-4efc-a277-036e0d770586'::uuid),  -- RGM MULTISERVICES
  ('5fcd73fd-8b03-429c-a144-c778d8de7156'::uuid),  -- RGP MULTISERVICES
  ('73c70127-ddfa-47f8-b4ba-367784dde2df'::uuid),  -- RHM RENOVATION
  ('4bf2272a-d4a1-4ff2-8ac3-c599fd8e424e'::uuid),  -- RI RENOVATION
  ('5f0fea98-ccce-4148-aec1-74824e839bed'::uuid),  -- RIVAGES RENOVATION
  ('6a91cf7d-9b76-428f-a827-6d179bf3e533'::uuid),  -- RJ MULTISERVICES 86
  ('f88e7c69-01a6-41d7-b56e-6a73f5e2e010'::uuid),  -- RJ RENOV
  ('47753a03-6e31-4ac4-8417-5166db396ec6'::uuid),  -- RM-RENOV
  ('c7ff1dfa-e0f6-4b33-8ae2-4a9c2e8cdd6d'::uuid),  -- RMS MULTISERVICES
  ('b9447fb7-3a5b-42f3-aaeb-207e35cc6d53'::uuid),  -- RN RENOVATIONS
  ('5948cecc-c0b5-4442-aba2-a209ce10143c'::uuid),  -- ROBERT MULTISERVICES BATIMENT
  ('5db8aed5-0a1c-46dd-a2b3-416dd5debc1a'::uuid),  -- ROBERT RENOV
  ('96ff3b87-2c1c-49d5-8287-f201b5c315e6'::uuid),  -- ROBERT RENOVATION
  ('305933d2-64c1-4dbf-956c-f81816672bc4'::uuid),  -- ROBERTO  MULTISERVICES
  ('7f6dd971-5f1c-4192-bd43-da2a6bbf9170'::uuid),  -- ROCA RENOVATION
  ('1bd383fe-3c51-4379-94f9-ce2110916110'::uuid),  -- RODO.RENOVE
  ('b2bf4900-dc9a-49f3-b47a-db38e2c901e5'::uuid),  -- RP RENOVATION
  ('05a626a5-40ae-4525-9cec-402c3151073b'::uuid),  -- RS MULTI-SERVICES
  ('693429d8-084a-49b6-a9bb-c654b3d29d79'::uuid),  -- RS RENOVATION
  ('01b9a8c3-09bb-4fb0-9cbe-4ed49a474507'::uuid),  -- RS-RENOV-ENTRETIEN
  ('e2a04072-87ad-437c-8220-e89e5d6463ba'::uuid),  -- S.I RENOVATION
  ('424d480b-47cb-46eb-a0f6-308ffa6b2ee3'::uuid),  -- S.J MULTI SERVICES
  ('e24b2b87-cee0-4916-846a-e6483c273841'::uuid),  -- S.T.MULTISERVICES
  ('7bb7b95c-36d1-44cd-81ed-c4e953b0e662'::uuid),  -- S1CERE RENOV
  ('e0f8f555-0cb4-4547-bedd-767badd56fbd'::uuid),  -- SABER RENOVATION
  ('6049378e-03d5-46c4-8144-b23ed9a53c57'::uuid),  -- SAM MULTISERVICES
  ('cfa24db9-21e5-4bd2-ba18-973d5d22fcc8'::uuid),  -- SAMSON TRAVAUX RENOVATION
  ('7119c88a-138d-478f-8b28-2d18dbd48c36'::uuid),  -- SANFILIPPO MULTISERVICES
  ('a701474b-6dc1-4f92-acfb-2067fa2d17c1'::uuid),  -- SANTA MULTISERVICES
  ('ce39b39c-f8fe-4429-a7ad-b9c0827a6564'::uuid),  -- SARL LYCOS RENOVATION
  ('54750253-f2b5-4f0f-9365-037ed2585cf3'::uuid),  -- SARL PRO RENOV
  ('03cfd853-2258-4151-9eea-fc71f71a26bb'::uuid),  -- SAS 2LC RENOVATION
  ('7abcd72a-063c-4d26-9bec-92f6696b0e01'::uuid),  -- SAS ID AGENCEMENT ET RENOVATION
  ('e7397e22-b250-467c-9fe1-aae919511efb'::uuid),  -- SAS RICHARD CREA-RENOV
  ('792c8d3d-e89c-4a5f-8386-c158e5a8d511'::uuid),  -- SASU MARILLY MULTI SERVICES
  ('f9f9db84-d169-4580-9619-c7114c75135a'::uuid),  -- SB RENOV
  ('7d13377d-7edf-4cdc-a88b-f3d2123f0f32'::uuid),  -- SBH MULTI-SERVICES
  ('aee145d3-f6b3-49fe-b74f-7b02c2340564'::uuid),  -- SC RENOVATION
  ('30b460ca-03af-4809-a44d-cca4389bf389'::uuid),  -- SC RENOVATION & MULTI-SERV'
  ('771949f5-05e0-47cf-93d2-747f92626da8'::uuid),  -- SD RENOV
  ('b298b52c-6e86-419a-9947-a4047fc1f06c'::uuid),  -- SD RENOV CONCEPT
  ('94f535b9-1a7d-49a9-ad7e-a7eaa975c88f'::uuid),  -- SD04 MULTI SERVICES
  ('b81e76ae-5684-40af-8bdf-9916002cec27'::uuid),  -- SE MULTISERVICES
  ('093a1dc3-652e-46ac-af86-3f06d548134e'::uuid),  -- SEB MULTISERVICES
  ('613984d3-b55f-4bd5-b4aa-9b41d8e9619f'::uuid),  -- SEB MULTISERVICES
  ('d1fd0c08-1dfc-4849-9a34-ca9f217a66f4'::uuid),  -- SEBMULTISERVICES
  ('60d70c06-c48a-42ef-a675-61a5961f03d8'::uuid),  -- SELOSSE RENOVATION
  ('ac83f831-df4b-4d56-b727-fcc9a1d2b5f7'::uuid),  -- SENO RENOVATION
  ('832617e7-0b10-4318-931d-23832e328abd'::uuid),  -- SENYUAN RENOV
  ('7d05271c-2a49-4bbc-8e24-2ca95b5dde3a'::uuid),  -- SERGE MULTISERVICES
  ('72f193bd-7f2e-41e0-8a95-32733c2eb1ea'::uuid),  -- SERJ-RENOVATION
  ('8b560316-2954-4b36-819a-1a0ec2520256'::uuid),  -- SERVICES RENOVATION
  ('2e0fe987-fee3-49ce-84a7-2f01dbd3e808'::uuid),  -- SEY.RENOV
  ('2edf3451-0831-4c0c-8584-eb7c73dee3e1'::uuid),  -- SH RENOVATION
  ('81406b9c-0b62-4fba-b12f-711dd663ef98'::uuid),  -- SHD RENOVATION
  ('5a54be62-5aab-4e51-9c58-f781d0cd8d37'::uuid),  -- SIG RENOV
  ('ee362a82-5b29-4be1-98d5-aec54163da25'::uuid),  -- SIGNATURE RENOVATION
  ('05c8c37d-56b9-4244-9728-1b19fed2d423'::uuid),  -- SIMINTEVENTIONSMULTISERVICES
  ('d125fc6d-7e28-4c57-8e88-2e320b2e424e'::uuid),  -- SIQUEIRA RENOVATION
  ('c5e51b23-5d2b-41a1-b2d8-6f8eebb9e3b2'::uuid),  -- SK MULTISERVICES
  ('38fc1be1-5ce9-438e-bcab-c6dbf4ea644f'::uuid),  -- SK RENOV
  ('e605f800-408d-4592-87ae-910bd5ce2009'::uuid),  -- SM RENOVATION
  ('ddc04112-e05e-40a0-915f-dcec44a67a1f'::uuid),  -- SOLTANA RENOV
  ('3fd5f9c2-ae6e-4b8c-bad8-b20b8aa07841'::uuid),  -- SOLUTION MULTI SERVICES
  ('70b062d3-272a-443b-b33f-103eca40553c'::uuid),  -- SOLUTION RENOVATION
  ('6ca7bae0-f66f-4be0-af71-c236d5e21598'::uuid),  -- SOLUTION RENOVE
  ('24873132-d3bf-4ee3-9957-82f221868dc6'::uuid),  -- SOLUTIONS 13 MULTISERVICES
  ('94183428-530e-4107-beaf-3cbcc30585aa'::uuid),  -- SPRIX RENOV
  ('51e3f662-c3aa-44d8-894a-690540929f58'::uuid),  -- SS RENOV
  ('ccfd476b-c623-46fb-a6e6-9d0bc9a939f8'::uuid),  -- ST MULTISERVICE
  ('004d38bd-6778-42dc-a888-c0f304cce6ef'::uuid),  -- ST MULTISERVICES
  ('8e16d0a5-73ac-45b5-87e6-8174f1707afb'::uuid),  -- STAR RENOVE 86
  ('eba9c491-5b4a-40b7-a77e-079dd722d1d5'::uuid),  -- STASIUK RENOVATION
  ('1e40ef6e-c516-4414-b7f7-773a122f40f6'::uuid),  -- STMH BATI.RENOV
  ('be42b262-9c08-4b62-97b1-b4e951070718'::uuid),  -- SUD EST RENOV
  ('43f7d5a7-8a29-42ac-9afa-0592928b36e4'::uuid),  -- SUD RENOVATION CONFORT
  ('726cd7c3-ef09-4e77-a4b1-169c8fee376f'::uuid),  -- SUD-OUEST RENOVATION
  ('201a9a2c-3cb3-4864-ac98-f5883cd2e483'::uuid),  -- SUN MULTISERVICES
  ('d8ac8233-7eac-4e78-80d6-f150c157f0c5'::uuid),  -- TD HOME MULTI-SERVICES
  ('e5018572-cc40-46b5-81a2-4e9a46a5a833'::uuid),  -- TD MULTI SERVICES
  ('fb023606-a226-441d-9fcc-aa11d6e85a03'::uuid),  -- TDE MULTISERVICES
  ('14a6da68-5a11-4417-ab62-31410d4a0402'::uuid),  -- TED MULTI SERVICES
  ('2310b10f-b2f7-4ed3-a11a-4d3dfacea665'::uuid),  -- TEDDY TIERCELIN RENOVATION
  ('ec72f560-f8ec-4488-9ea9-69b5d8b099e2'::uuid),  -- TGD MULTISERVICES
  ('ce38f9fd-3e89-4e55-ab48-080dfd0ba3f7'::uuid),  -- TH-MULTI-SERVICES
  ('abc6e344-1f97-4ac6-ab7c-2209902b9f6d'::uuid),  -- THIERRY MULTISERVICES
  ('827a10d3-e899-4fbe-a1b9-2daa8faba713'::uuid),  -- THOKE RENOVER
  ('06836275-d74a-44aa-a5b9-b812d7dc1c2e'::uuid),  -- TK MULTISERVICES
  ('6a845aee-7590-4936-b566-99ebd5381cb6'::uuid),  -- TLBD MULTISERVICE
  ('0b347394-2a84-4d03-b3b4-0e115099a84a'::uuid),  -- TM RENOV 14
  ('bd9734c2-7921-412d-bb66-b8127c64850f'::uuid),  -- TM RENOV CONSTRUCT
  ('57fd61cb-09bb-454e-aabf-e9bf9d67d4bc'::uuid),  -- TMK RENOVATION
  ('f2d38c47-c10a-44be-a558-9b51a1918ee4'::uuid),  -- TN RENOV
  ('5bbb00ac-5f64-4050-91ca-7db6911e3f00'::uuid),  -- TNF.RENOV
  ('69ad8caa-ce50-4f83-b48b-5f8e0046120d'::uuid),  -- TOM RENOV
  ('e164f0b9-7cd1-4798-84ad-f210e54dce11'::uuid),  -- TONIUTTI RENOVATION
  ('d0cce60c-32b2-4e8a-857c-3b4d61002b37'::uuid),  -- TOP MULTI SERVICES
  ('f353f8dd-4565-4923-b843-775795fa798b'::uuid),  -- TOP RENOVATION
  ('11ab4a86-ffec-4bdc-9f04-4eb8d8a81103'::uuid),  -- TOPH' MULTISERVICES
  ('caaedffb-2d42-4079-b5f0-e240f652a02b'::uuid),  -- TOTALE RENOVATION 76
  ('73506359-9032-4045-a4d2-e80ebc499278'::uuid),  -- TRAVAUX & RENOVATION
  ('9c5ced92-2758-4076-82f5-c830aba5602f'::uuid),  -- TRAVAUX & RENOVATION
  ('cc6efe92-79d0-4568-b871-94ba99e0616a'::uuid),  -- TT RENOV'SERVICES
  ('918341fc-99e4-4706-bff9-4ee350efa7ff'::uuid),  -- U.D RENOV
  ('48e888d7-5cbf-4da1-b97a-818fc3081145'::uuid),  -- URBAN CONCEPT MULTI-SERVICES
  ('e582ba3d-bafe-4109-9362-be4718fb5e80'::uuid),  -- V.C.RENOV
  ('883e7ede-c88b-42d8-9ccd-a8899db6f40c'::uuid),  -- VANS MULTISERVICES BATIMENT
  ('b89a73d6-2987-4c3b-9ada-f1908b7fe701'::uuid),  -- VASIANA RENOVE
  ('91a60c41-b90b-46ab-b22b-7a64ea1abad7'::uuid),  -- VB MULTI SERVICES
  ('3a930af5-a6b1-4ca7-a704-a8bf2c42acda'::uuid),  -- VB MULTISERVICES
  ('eb338cab-3cd7-48a0-96c0-e4d70e137dfe'::uuid),  -- VICTOR SERVICES RENOVATION
  ('4e1a15ce-5516-4b26-8f3d-f713b7583115'::uuid),  -- VINCE RENOV
  ('df0364ad-1666-44b2-8509-b814104eeac9'::uuid),  -- VL RENOVATION
  ('ac0d3f3c-da96-492c-806f-7040c796088a'::uuid),  -- VM MULTISERVICES
  ('ee691e18-4d3d-4e17-a250-c0d4ee4ac90b'::uuid),  -- VM RENOV
  ('9f904b3d-a4f0-4310-b5c2-a677546af172'::uuid),  -- VOLFI RENOVATION
  ('3404135b-b40b-4030-93fc-037b98d150ca'::uuid),  -- VOSGES RENOV FACADE
  ('420b463b-bb7a-4452-a630-9b75e737925f'::uuid),  -- VP RENOV
  ('e0f8e912-eaa5-4021-992a-1d35f430ca3f'::uuid),  -- VSL-RENOVATION
  ('7e75e6ee-bc30-4c59-bf71-673b7125631a'::uuid),  -- VTH MULTISERVICES
  ('e590e498-6b5c-4e5b-afce-50840243edb6'::uuid),  -- VULAJ RENOVATION
  ('67a8452a-137a-49ce-aff3-a8b9775d6919'::uuid),  -- WB MULTISERVICES
  ('bb24f77a-0aa9-4cf9-a5e1-8b68fd4d9e24'::uuid),  -- WB.MULTI RENOV'
  ('5cb844e7-c46b-40ec-a325-90c9c6c3aacf'::uuid),  -- WEBER MULTI SERVICES
  ('586b3955-1228-47e9-9cd3-fb492120deb7'::uuid),  -- WILLIAM MULTISERVICES
  ('5dbd0a81-269c-47e9-8726-cebe822a1d57'::uuid),  -- WILLMULTISERVICES
  ('3539c006-c09b-4ecc-ae5d-690fabb98450'::uuid),  -- XAV MULTISERVICES
  ('6c316298-905c-42fb-9b79-e70115465f55'::uuid),  -- YANN MULTISERVICES
  ('3518aebc-eadb-42a6-8dd8-aa30b775a8b1'::uuid),  -- YO MULTISERVICES
  ('6de32f75-f07d-4bbb-bc87-44d91b256d40'::uuid),  -- YT RENOV'
  ('1c063801-566c-4ddd-b85c-c5a76eef5d77'::uuid),  -- YVANA TRANS-PRO'RENOV
  ('6291fdcb-a380-437d-b0be-75ed253c2f9a'::uuid),  -- ZAZA RENOVATION
  ('e7dce697-9b75-47f8-9bb8-ef6c59b3442a'::uuid),  -- ZGM RENOV'
  ('2f907ea6-d8f6-48af-9417-bb0b5f3e27cd'::uuid)  -- ZK RENOV
;

DO $$
DECLARE v_missing int; v_notplaq int; v_target uuid;
BEGIN
  SELECT id INTO v_target FROM public.metiers WHERE slug = 'multiservices';
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Migration 016 abort: metier multiservices introuvable (migration 012 absente?)';
  END IF;
  IF v_target <> '909b929c-bc02-4bf2-a7c3-9d678da93282'::uuid THEN
    RAISE EXCEPTION 'Migration 016 abort: metier_id multiservices live (%) != attendu 909b929c-bc02-4bf2-a7c3-9d678da93282', v_target;
  END IF;

  SELECT count(*) INTO v_missing
    FROM _reclass_016 r LEFT JOIN public.pros p ON p.id = r.pro_id WHERE p.id IS NULL;
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Migration 016 abort: % pro_id introuvables', v_missing;
  END IF;

  SELECT count(*) INTO v_notplaq
    FROM _reclass_016 r
    WHERE NOT EXISTS (SELECT 1 FROM public.pro_metiers pm
                      WHERE pm.pro_id = r.pro_id AND pm.metier_id = 'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f'::uuid);
  IF v_notplaq > 0 THEN
    RAISE EXCEPTION 'Migration 016 abort: % pros plus tagges plaquiste (deja reclasses?)', v_notplaq;
  END IF;
END $$;

UPDATE public.pros SET code_naf = '43.39Z', updated_at = now()
 WHERE id IN (SELECT pro_id FROM _reclass_016);

INSERT INTO public.pro_metiers (pro_id, metier_id, specialite)
SELECT r.pro_id, '909b929c-bc02-4bf2-a7c3-9d678da93282'::uuid,
       'reclassement 2026-06-03 (016) : NAF 43.39Z handyman/polyvalent -> Artisan multiservices (triage_naf4339z)'
  FROM _reclass_016 r
ON CONFLICT (pro_id, metier_id) DO NOTHING;

DELETE FROM public.pro_metiers
 WHERE metier_id = 'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f'::uuid
   AND pro_id IN (SELECT pro_id FROM _reclass_016);

COMMIT;

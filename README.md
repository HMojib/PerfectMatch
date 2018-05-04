# PerfectMatch
PerfectMatch is the final project for COMP 469 (Artificial Intelligence) at CSUN 

index.js contains the main entry point for gathering the data. It uses a folder called people with sub-directories of
people. Each people subdirectory should contain images and a .json file named users.json. The program will take these
"people" and run their images through the clarifair API. It currently only gathers demographic and general information
about the picture.

## Demographics Model
Demographic information include age, gender, and ethnicity. The ethnicity and gender is fairly accurate and the clarifai
model is about to accurately predict both. The gender demographic is averaged in order to get a fairly accurate estimate
of age.

### General Model
The general model will find tags in given images. Each image will have certain tags. These tags can then be used to
match users. Tags can be picture settings (i.e. beach, indoor, outdoor), objects in the picture, and more.
Energy Tracker Project
Database Setup
You need to create a database in MySQL using the SQL code in the Database Creation text file.

Configuration
Additionally, in the getData.py file, you need to update the MYSQL_CONFIG section with your own MySQL password and database name.

Instructions to Run the Code
To run this code, you need to open two separate terminals. Follow these steps:

First Terminal:
Navigate to the components directory:

Bil372Project> cd .\energy-tracker
Bil372Project\energy-tracker> cd src/components

Execute the getData.py script: Bil372Project\energy-tracker\src\components> python getData.py

Second Terminal:
Navigate to the energy-tracker directory

Bil372Project> cd energy-tracker

Install necessary dependencies:

Bil372Project\energy-tracker> npm install

Start the application:

Bil372Project\energy-tracker> npm start
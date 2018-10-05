const Migrations = artifacts.require("../contracts/Migrations.sol");



console.log('1_initial_migration.js Migrations', Migrations);

module.exports = function(deployer) {

  console.log('init deploy, initial_migration.js');
  deployer.deploy(Migrations);
};


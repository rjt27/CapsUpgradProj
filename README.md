README file for composer chaincode is inside 'composer' directory

There are scripts available for setting up the network.

- To start the network: 
  sudo ./byfn.sh up
- To teardown a network
  sudo ./byfn.sh down

- Additionaly, just to generate Artifacts
  sudo ./byfn.sh generate

- In order to restart (down & up) the network:
  sudo ./byfn.sh restart

** byfn.sh requires supporting scripts, which are available in 'scripts' directory.


-----------------------------
Composer setup CLIs

# create cards:
  CONNECTION_PROFILE=./composer/networkConnection-infrastructure.yaml
  # Fetch the private key from crypto materials and use it to create the private key and certificate path
  CURRENT_DIR=$PWD
  cd crypto-config/peerOrganizations/infrastructure.reliance-network.com/users/Admin@infrastructure.reliance-network.com/msp/keystore/ || exit
  PRIV_KEY=$(ls *_sk)
  cd "$CURRENT_DIR" || exit
  PRIVATE_KEY=./crypto-config/peerOrganizations/infrastructure.reliance-network.com/users/Admin@infrastructure.reliance-network.com/msp/keystore/"${PRIV_KEY}"
  CERT=./crypto-config/peerOrganizations/infrastructure.reliance-network.com/users/Admin@infrastructure.reliance-network.com/msp/signcerts/Admin@infrastructure.reliance-network.com-cert.pem
  CARDOUTPUT=PeerAdmin@reliance-network-infrastructure.card
  # Create a new business network card for the administrator to use to deploy the composer business network to fabric network
  composer card create -p "$CONNECTION_PROFILE" -u PeerAdmin -c "$CERT" -k "$PRIVATE_KEY" -r PeerAdmin -r ChannelAdmin -f "$CARDOUTPUT"

  *************************************************
  **** Repease above steps (for creating cards, 21333) for all the orgs, i.e. infrastructure, power, communications, entertainment & capital
  *************************************************

  # Import the business network card for RelianceInfrastructure into the wallet
  composer card import -f PeerAdmin@reliance-network-infrastructure.card --card PeerAdmin@reliance-network-infrastructure

  *************************************************
  **** Repease above steps (for importing cards) for all the orgs, i.e. infrastructure, power, communications, entertainment & capital
  *************************************************

  **** Below step can be skipped, in case user want to deploy the bna file, already available in 'dist' ditectory
# To create the bna (Business Archive File)
  composer archive create -t dir -n . -a dist/reliance-network.bna

# Alternatively, you can use the file available in 'dist' ditectory
# Install the composer business network on fabric peer nodes for RelianceInfrastructure
# TODO: Repeat this step to install composer BBN on peers of all organizations
  composer network install --card PeerAdmin@reliance-network-infrastructure --archiveFile ./dist/reliance-network.bna

# Retrieve certificates for a user [Rajat] to use as the business network administrator for RelianceInfrastructure
  composer identity request -c PeerAdmin@reliance-network-infrastructure -u admin -s adminpw -d rajat

  *************************************************
  **** Repease above steps (for identity request) for all the orgs, i.e. infrastructure, power, communications, entertainment & capital
  *************************************************

# Start the business network with user [Rajat] from RelianceInfrastructure as the administrator allowing him to add new participants from their orgs.
# TODO: Add the administrators from other orgs to this command
  composer network start -c PeerAdmin@reliance-network-infrastructure -n reliance-network -V 0.0.1 -o endorsementPolicyFile=./endorsement-policy.json -A rajat -C rajam/admin-pub.pem

# Create a business network card that Rajat can use to access the business network on behalf of RelianceInfrastructure
  composer card create -p ./../"$CONNECTION_PROFILE" -u rajat -n reliance-network -c rajat/admin-pub.pem -k rajat/admin-priv.pem

# Import the business network card into wallet for RelianceInfrastructure admin user [Rajat]
  composer card import -f rajat@reliance-network.card

# Ping the network using this card just created
  composer network ping -c rajat@reliance-network

# Add a new participant (RelianceInfrastructure Pay) as a Manufacturer to the business network
  composer participant add -c rajat@reliance-network -d '{"$class":"org.reliance.tracking.Exporter","exporterID":"E1001", "userEmail":"e1001@relmail.com", "userAddress":"23N45S", "userBalance":"1000"}'

# Issue a new identity for the RelianceInfrastructure Pay manufacturer
  composer identity issue -c rajat@reliance-network -f exporter1.card -u exporter1 -a "resource:org.reliance.tracking.Exporter#E1001"
# Import the card for new RelianceInfrastructure Pay user into wallet
  composer card import -f exporter1.card
# Test the business network access of RelianceInfrastructure Pay user
  composer network ping -c exporter1@reliance-network



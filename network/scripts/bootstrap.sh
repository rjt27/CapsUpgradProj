#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Reliance Asset Tracking Network bootstrapping network"
echo
CHANNEL_NAME="$1"
DELAY="$2"
LANGUAGE="$3"
TIMEOUT="$4"
VERBOSE="$5"
: ${CHANNEL_NAME:="channelreliance"}
: ${DELAY:="5"}
: ${LANGUAGE:="node"}
: ${TIMEOUT:="15"}
: ${VERBOSE:="false"}
LANGUAGE=$(echo "$LANGUAGE" | tr [:upper:] [:lower:])
COUNTER=1
MAX_RETRY=15
ORGS="infrastructure power communications entertainment capital"

if [ "$LANGUAGE" = "node" ]; then
  CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/"
fi

if [ "$LANGUAGE" = "java" ]; then
  CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/"
fi

echo "Channel name : "$CHANNEL_NAME

# import utils
. scripts/utils.sh

createChannel() {
  setGlobals 0 'infrastructure'

  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer channel create -o orderer.reliance-network.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx >&log.txt
    res=$?
    set +x
  else
    set -x
    peer channel create -o orderer.reliance-network.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Channel creation failed"
  echo "===================== Channel '$CHANNEL_NAME' created ===================== "
  echo
}

joinChannel() {

  for org in $ORGS; do
    for peer in 0 1; do
      joinChannelWithRetry $peer $org
      echo "===================== peer${peer}.${org}.reliance-network.com  joined channel '$CHANNEL_NAME' ===================== "
      sleep $DELAY
      echo
    done
  done
}

## Create channel
echo "Creating channel..."
createChannel

## Join all the peers to the channel
echo "Having all peers join the channel..."
joinChannel

## Set the anchor peers for each org in the channel
echo "Updating anchor peers for RelianceInfrastructure..."
updateAnchorPeers 0 'infrastructure'
echo "Updating anchor peers for ReliancePower..."
updateAnchorPeers 0 'power'
echo "Updating anchor peers for RelianceCommunications..."
updateAnchorPeers 0 'communications'
echo "Updating anchor peers for RelianceEntertainment..."
updateAnchorPeers 0 'entertainment'
echo "Updating anchor peers for RelianceCapital..."
updateAnchorPeers 0 'capital'

echo
echo "========= All GOOD, Reliance Asset Tracking Network Bootstrap completed =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0

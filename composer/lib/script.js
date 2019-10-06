/**
 * New script file
 */
/** 
 * Create a new Property 
 * @param {org.reliance.tracking.AccelerationReading} tx
 * @transaction
 */
async function AccelerationReading(tx) {
  const factory = getFactory();
  /* fetch the shipment registry */
  let shipRegistry = await getAssetRegistry('org.reliance.tracking.Shipment');
  let isExists = await shipRegistry.get(tx.shipment.shipmentID).catch(err => {
    console.log('Shipment not found');
  });
  if(!isExists) {
    throw new Error('No Such shipment exist');
  }
  /* fetch the contract registry */
  let contractRegistry = await getAssetRegistry('org.reliance.tracking.Contract');
  isExists = await contractRegistry.get(tx.shipment.contract.contractID).catch(err => {
    console.log('Contract not found');
  });
  if(!isExists) {
    throw new Error('No Such contract exist');
  }
  
  let maxAccr = tx.shipment.contract.maxAcceleration;
  /*
   * check acceleration reading against contract's maxAcceleration.
   * If exceeds, raise AccelerationThresholdEvent event.
   */
  if(tx.accelerationX > maxAccr || tx.accelerationY > maxAccr || tx.accelerationZ > maxAccr) {
    let event = factory.newEvent('org.reliance.tracking', 'AccelerationThresholdEvent');
    event.message = "exceeded"
  	event.latitude = tx.latitude;
    event.longitude = tx.longitude;
    event.readingTime = tx.readingTime;
    event.accelerationX = tx.accelerationX;
  	event.accelerationY = tx.accelerationY;
    event.accelerationZ = tx.accelerationX;
    event.shipment = tx.shipment;
    emit(event);
  }
  /* add AccelerationReading to shipment & update the shipment registry */
  tx.shipment.acclrReadings.push(tx);
  await shipRegistry.update(tx.shipment);
}

/** 
 * Create a new Property 
 * @param {org.reliance.tracking.TemperatureReading} tx
 * @transaction
 */
async function TemperatureReading(tx) {
  const factory = getFactory();
  /* fetch the shipment registry */
  let shipRegistry = await getAssetRegistry('org.reliance.tracking.Shipment');
  let isExists = await shipRegistry.get(tx.shipment.shipmentID).catch(err => {
    console.log('Shipment not found');
  });
  if(!isExists) {
    throw new Error('No Such shipment exist');
  }
  /* fetch the contract registry */
  let contractRegistry = await getAssetRegistry('org.reliance.tracking.Contract');
  isExists = await contractRegistry.get(tx.shipment.contract.contractID).catch(err => {
    console.log('Contract not found');
  });
  if(!isExists) {
    throw new Error('No Such contract exist');
  }
  
  let tempMin = tx.shipment.contract.minTemp;
  let tempMax = tx.shipment.contract.maxTemp;
  /*
   * check temperature reading against contract's minimum/maximum Temperature.
   * If beyond min/max temperature, raise TemperatureThresholdEvent event.
   */
  if(tx.tempCelsius < tempMin || tx.tempCelsius > tempMax) {
    let event = factory.newEvent('org.reliance.tracking', 'TemperatureThresholdEvent');
    event.message = "exceeded"
  	event.latitude = tx.latitude;
    event.longitude = tx.longitude;
    event.readingTime = tx.readingTime;
    event.temperature = tx.tempCelsius;
    event.shipment = tx.shipment;
    emit(event);
  }
  /* add TemperatureReading to shipment & update the shipment registry */
  tx.shipment.tempReadings.push(tx);
  await shipRegistry.update(tx.shipment);
}
/** 
 * Create a new Property 
 * @param {org.reliance.tracking.GPSReading} tx
 * @transaction
 */
async function GPSReading(tx) {
  const factory = getFactory();
  /* fetch the shipment registry */
  let shipRegistry = await getAssetRegistry('org.reliance.tracking.Shipment');
  let isExists = await shipRegistry.get(tx.shipment.shipmentID).catch(err => {
    console.log('Shipment not found');
  });
  if(!isExists) {
    throw new Error('No Such shipment exist');
  }
  /* fetch the contract registry */
  let contractRegistry = await getAssetRegistry('org.reliance.tracking.Contract');
  isExists = await contractRegistry.get(tx.shipment.contract.contractID).catch(err => {
    console.log('Contract not found');
  });
  if(!isExists) {
    throw new Error('No Such contract exist');
  }
  /* fetch importer's location */
  let importerRegistry = await getParticipantRegistry('org.reliance.tracking.Importer');
  const importer = await importerRegistry.get(tx.shipment.contract.contractImporter.getIdentifier());
  var importerLoc = importer.userAddress;
  /*
   * check GPS reading against importer's location.
   * If both location matches, raise ShipmentInAPortEvent event.
   */
  var currLoc = tx.latitude + tx.latitudeDirection.toString() + tx.longitude + tx.longitudeDirection.toString();
  if(currLoc.localeCompare(importerLoc) == 0) {
    let event = factory.newEvent('org.reliance.tracking', 'ShipmentInAPortEvent');
    event.message = "ShipmentInAPort"
    event.shipment = tx.shipment;
    emit(event);
  }
  /* add GPSReading to shipment & update the shipment registry */
  tx.shipment.gpseadings.push(tx);
  await shipRegistry.update(tx.shipment);
}

/** 
 * Create a new Property 
 * @param {org.reliance.tracking.ShipmentReceived} tx
 * @transaction
 */
async function ShipmentReceived(tx) {
  const factory = getFactory();
  /* fetch the shipment registry */
  let shipRegistry = await getAssetRegistry('org.reliance.tracking.Shipment');
  let isExists = await shipRegistry.get(tx.shipment.shipmentID).catch(err => {
    console.log('Shipment not found');
  });
  if(!isExists) {
    throw new Error('No Such shipment exist');
  }
  /* fetch the contract registry */
  let contractRegistry = await getAssetRegistry('org.reliance.tracking.Contract');
  isExists = await contractRegistry.get(tx.shipment.contract.contractID).catch(err => {
    console.log('Contract not found');
  });
  if(!isExists) {
    throw new Error('No Such contract exist');
  }
  /* calculate the actual payout, without penalty. */
  let totalPayout = (tx.shipment.unitCount) * (tx.shipment.contract.unitPrice);
  let actualPayout = totalPayout;
  let totalPenalty = 0;
  /* mark the shipment as ARRIVED */
  tx.shipment.status = 'ARRIVED';
  var now = new Date();
  /* penalty calculations. For details, please check README file */
  if(tx.shipment.contract.arrivalTime < now) {
    totalPayout = 0;
    totalPenalty = actualPayout;
  } else {
    let tempData = tx.shipment.tempReadings;
    let minTempReading = tempData.reduce((min, t) => (t.tempCelsius < min) ? t.tempCelsius : min, tempData[0].tempCelsius);
    let maxTempReading = tempData.reduce((max, t) => (t.tempCelsius > max) ? t.tempCelsius : max, tempData[0].tempCelsius);

    let acclrData = tx.shipment.acclrReadings;
    let maxAccelerationX = acclrData.reduce((max, t) => (t.accelerationX > max) ? t.accelerationX : max, acclrData[0].accelerationX);
    let maxAccelerationY = acclrData.reduce((max, t) => (t.accelerationY > max) ? t.accelerationY : max, acclrData[0].accelerationY);
    let maxAccelerationZ = acclrData.reduce((max, t) => (t.accelerationZ > max) ? t.accelerationZ : max, acclrData[0].accelerationZ);
    let maxAcceleration = Math.max(maxAccelerationZ, Math.max(maxAccelerationX, maxAccelerationY));

    let penalty = 0;
    if(minTempReading < tx.shipment.contract.minTemp) {
      penalty += (tx.shipment.contract.minTemp - minTempReading) * 1/10;
    }
    if(maxTempReading > tx.shipment.contract.maxTemp) {
      penalty += (maxTempReading - tx.shipment.contract.maxTemp) * 1/10;
    }
    if(maxAcceleration > tx.shipment.contract.maxAcceleration) {
      penalty += (maxAcceleration - tx.shipment.contract.maxAcceleration) * 1/10;
    }
    if(penalty > 0) {
       if(penalty < tx.shipment.contract.minPenaltyFactor) {
         penalty = tx.shipment.contract.minPenaltyFactor;
       } else if(penalty > tx.shipment.contract.maxPenaltyFactor) {
         penalty = tx.shipment.contract.maxPenaltyFactor;
       }
    }
    totalPenalty = penalty * tx.shipment.unitCount;
    totalPayout = totalPayout - totalPenalty;
  }

  // actualPayout - Original payout without penalty consideraltion.
  // totalPayout - Adjusted payout, with penalty consideraltion.

  /* fetch the exporter registry, update the exporter's balance & update registry */
  let exporterRegistry = await getParticipantRegistry('org.reliance.tracking.Exporter');
  const exporter = await exporterRegistry.get(tx.shipment.contract.contractExporter.getIdentifier());
  exporter.userBalance += (totalPayout/2);
  await exporterRegistry.update(exporter);

  /* fetch the importer registry, update the importer's balance & update registry */
  let importerRegistry = await getParticipantRegistry('org.reliance.tracking.Importer');
  const importer = await importerRegistry.get(tx.shipment.contract.contractImporter.getIdentifier());
  importer.userBalance -= totalPayout;
  await importerRegistry.update(importer);

  /* fetch the shipper registry, update the shipper's balance & update registry */
  let shipperRegistry = await getParticipantRegistry('org.reliance.tracking.Shipper');
  const shipper = await shipperRegistry.get(tx.shipment.contract.contractShipper.getIdentifier());
  shipper.userBalance += (totalPayout/2);
  await shipperRegistry.update(shipper);
  
  /* update the shipment registry */
  await shipRegistry.update(tx.shipment);
}

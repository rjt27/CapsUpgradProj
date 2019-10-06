This is the readme file for the Business Network Definition created in Playground

------------------------------------------------------------------------------------------
AccelerationReading Transaction
    - check for a valid Shipment & Contract ID.
    - check if acceleration exceeded the max value defined in Contract. If so,
      Raise a "Acceleration Threshold" event.
    - Add Acceleration reading to shipment registry.
    - Save the shipment asset registry.

TemperatureReading Transaction
    - check for a valid Shipment & Contract ID.
    - check if temperature reading is beyond the minimum & maximum values defined
      in Contract. If so, Raise a "Temperature Threshold" event.
    - Add Temperature reading to shipment registry.
    - Save the shipment asset registry.

GPSReading Transaction
    - check for a valid Shipment & Contract ID.
    - check if GPS location from the transaction matches with the location of
      Importer. If so, Raise a "ShipmentInAPort" event.
    - Add GPS reading to shipment registry.
    - Save the shipment asset registry.

ShipmentReceived Transaction
    - check for a valid Shipment & Contract ID.
    - calculate the totalPayout (unit * per unit price).
    - check the current time with Shipment's (expected) arrival time (as per contract).
        - If late, set the totalPayout to ZERO.
        - Else, calculate the penalty
          - Check the mininum & maximum temprature recorded from shipment.
          - Check the maximum acceleration recorded from shipment.
          - If minimum temprature recorded is less than contract's minimum
            temprature, calculate penalty as
                (contract's minTemp - minTempReading)*1/10.
          - Similarly, If maximum temprature recorded is more than contract's maximum
            temprature, calculate penalty as
                (maxTempReading - contract's maxTemp)*1/10.
          - Similarly, If maximum acceleration recorded is more than contract's maximum
            acceleration, calculate penalty as
                (maxAcceleration - contract's maxAcceleration)*1/10.
          - Add all the 3 penalties above.
          - If, penalty is greater than contract's minPenaltyFactor
                change penalty to minPenaltyFactor.
          - Or If, penalty is less than contract's maxPenaltyFactor
                change penalty to maxPenaltyFactor.
          - final penalty amount (totalPenalty) is penalty * unitCount.
          - subtract the totalPenalty from totalPayout.
    - Read the exporterRegistry, add half of totalPayout amount to exporter's
        balance.
    - Read the shipperRegistry, add remaining half of totalPayout amount to
        shipper's balance.
    - Read the importerRegistry, deduct totalPayout amount from importer's balance.
    - change the shipmnet status to "ARRIVED".
    - Save the shipment asset registry.
------------------------------------------------------------------------------------------

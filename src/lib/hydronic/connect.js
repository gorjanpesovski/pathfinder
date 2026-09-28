import { HYDRONIC_ELEMENTS, mediumOf } from "./elements.js";

const NL = "\n";
const SEPARATOR = " ";

const STATION = [
  "[LocalStationSetting]",
  "StationName_00000000000000000000000000000000=",
  "AdapterName_00000000000000000000000000000000=",
  "AdapterDriverIds_00000000000000000000000000000000=0",
  "AdapterType_00000000000000000000000000000000=0",
  "AdapterFlags_00000000000000000000000000000000=0",
  "IpDhcp_00000000000000000000000000000000=0",
  "IpDhcpV6_00000000000000000000000000000000=0",
  "IpAutoconfV6_00000000000000000000000000000000=0",
  "IpDisableV6_00000000000000000000000000000000=0",
  "IpDisableV4_00000000000000000000000000000000=0",
  "H1TimeoutAck=90",
  "H1TimeoutCrFast=18",
  "H1TimeoutCrSlow=90",
  "H1TimeoutLife=1080",
  "H1TimeoutRetrySend=5",
  "H1NoCrShort=20",
  "H1NoRetrySend=100",
  "H1MaxCredit=1",
  "H1TpduSize=11",
  "H1ClassOptions=66",
  "H1ProtOption=3",
  "IpTimeoutCrFast=2000",
  "IpTimeoutCrSlow=3000",
  "IpNoCrShort=20",
  "IpTimeoutError=29700",
  "IpTimeoutLifeAcks=14960",
  "IpTimeoutArp=600050",
  "IpTimeoutResolve=600050",
  "IpStartPoolTcpPort=1025",
  "IpStartPoolUdpPort=1025",
  "IpTimeoutRetrySend=550",
  "IpNoRetrySend=100",
  "IpMss=1440",
  "IpTimeoutLifeDataAcks=10010",
  "IpNoSignatureFactor=5",
  "IpRFC1006Factor=5",
  "IpMustAck=165",
  "NtpActive=No",
  "NtpUrl=",
  "NtpMinutesRate=0",
  "ClockTimeZoneName=Europe,Vienna",
  "SshUser=",
  "SshUsed=0",
  "SshPort=0",
  "SymbolImportFlags=2",
  "NumberSeparator=,",
  "LanguageCode=en",
  "PeLicenseFlags=0",
  "OpcPipeLifeackRate=6000",
  "OpcPipeLifeackCheckRate=18000",
  "MaxBrowsePathLen=100",
  "SystemSettingsVersion=V2",
  "StructAutoImport=Yes",
  "OpcUaFlags=0",
  "OpcUaDiscoverySecurityMode=",
  "OpcUaLifeackRate=10000",
  "BACnetOwnDeviceId=1",
  "LoggingBits=Critical,Severe,AppError,RemoteError,SqlError",
  "LoggingBits2=",
  "ServiceConfigServer=Yes",
  "ServicePlcServer=Yes",
  "ServiceLogger=Yes"
];

const SYSTEM_SECTIONS = [
  [
    "[OPC UA Server]",
    "TypeOfConnection=TCPIP,UseOpcUA,Server,WriteAllowed",
    "IsActivated=Yes",
    "PollTime=1000",
    "BlockSize=10",
    "ApplicationTimeout=20000",
    "ReconnectTimeout=10000",
    "OptimizerFlags=KeepWriteSequence,SyncReadPriority,OptimizeOverIO",
    "ReadAccessLevel=7",
    "WriteAccessLevel=7",
    "Adapter_1=lo<00 00 00 00 00 00 00 00 00 00 00 00 00 00>",
    "IpDestination_1=0.0.0.0",
    "IpPort_1=4855",
    "IpLineType_1=Server",
    "IpProtocol_1=TCP",
    "IpBitFlags_1=LifeAcks,DoNotWaitSendAck,LifeDataAcks,AckWithOldData",
    "OpcUaSecurityMode_1=NoSecurity,Sign,SignEncrypt,Basic128RSA15,Basic256,Basic256SHA256,Anonymous",
    "NumberOfUaInstances_1=8",
    "GroupUpdateRate_1=100",
    "OpcUaOptions_1=0",
    "OpcUaConnFlags_1=IpAddressInsteadStationName",
    "OpcUaMinFreeSize_1=1048576",
    "OpcUaMaxQueueSize_1=0"
  ],
  [
    "[Memory]",
    "TypeOfConnection=Client,UseMemory,WriteAllowed",
    "IsActivated=Yes",
    "PollTime=1000",
    "BlockSize=10",
    "ApplicationTimeout=20000",
    "ReconnectTimeout=10000",
    "ReadAccessLevel=7",
    "WriteAccessLevel=7"
  ],
  [
    "[System]",
    "TypeOfConnection=Client,WriteAllowed,UseSystem",
    "IsActivated=Yes",
    "PollTime=60000",
    "BlockSize=10",
    "ApplicationTimeout=20000",
    "ReconnectTimeout=10000",
    "OptimizerFlags=KeepWriteSequence,SyncReadPriority,OptimizeOverIO",
    "ReadAccessLevel=7",
    "WriteAccessLevel=7"
  ],
  [
    "[OPC UA System Items]",
    "TypeOfConnection=Client,WriteAllowed,UseUaItems",
    "IsActivated=Yes",
    "PollTime=1000",
    "BlockSize=10",
    "ApplicationTimeout=20000",
    "ReconnectTimeout=10000",
    "OptimizerFlags=KeepWriteSequence,SyncReadPriority,OptimizeOverIO",
    "ReadAccessLevel=7",
    "WriteAccessLevel=7",
    "UaRootNode=Objects"
  ],
  [
    "[Config]",
    "TypeOfConnection=Client,WriteAllowed,UseConfig",
    "IsActivated=Yes",
    "PollTime=1000",
    "BlockSize=10",
    "ApplicationTimeout=20000",
    "ReconnectTimeout=10000",
    "OptimizerFlags=KeepWriteSequence,SyncReadPriority,OptimizeOverIO",
    "ReadAccessLevel=7",
    "WriteAccessLevel=7"
  ]
];

function modbusSection(name, ip, port, slave, adapter){
  return [
    `[${name}]`,
    "TypeOfConnection=TCPIP,ModbusProt,Client,WriteAllowed",
    "IsActivated=Yes",
    "PollTime=1000",
    "BlockSize=252",
    "ApplicationTimeout=10000",
    "ReconnectTimeout=10000",
    "OptimizerFlags=KeepWriteSequence,SyncReadPriority,OptimizeOverIO",
    "ReadAccessLevel=7",
    "WriteAccessLevel=7",
    ...(adapter ? [`Adapter_1=${adapter}`] : []),
    `IpDestination_1=${ip}`,
    `IpPort_1=${port}`,
    "IpLineType_1=Client",
    "IpProtocol_1=TCP",
    "IpBitFlags_1=LifeAcks,DoNotWaitSendAck,LifeDataAcks,AckWithOldData",
    `ModbusSlave_1=${slave}`,
    "ModbusStartOne_1=No",
    "ModbusRTU_1=No",
    "ModbusNoWriteSingleReg_1=No",
    "ModbusNoWriteBitmaskReg_1=No",
    "ModbusNoWriteMultiReg_1=No",
    "ModbusNoWriteSingleOut_1=No",
    "ModbusNoWriteMultiOut_1=No",
    "ModbusByteSwap_1=No",
    "Modbus32WordSwap_1=No",
    "ModbusWriteBitmaskRegEmulation_1=No",
    "ModbusParallelRequests_1=No",
    "ModbusSlaveFromItemSyntax_1=No",
    "ModbusPassiveMultipleSlaves_1=No"
  ];
}

function kindOf(shape){
  return shape?.kind === "equipment" ? HYDRONIC_ELEMENTS[shape.type]?.device ?? null : null;
}

export function connectionName(name){
  return String(name ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "Device";
}

export function groupName(name){
  return String(name ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 _-]+/g, "_").replace(/\s+/g, " ").trim() || "Gateway";
}

function graph(shapes){
  const links = new Map();
  const link = (a, b) => {
    if (!links.has(a)) links.set(a, new Set());
    if (!links.has(b)) links.set(b, new Set());
    links.get(a).add(b);
    links.get(b).add(a);
  };
  for (const pipe of shapes.filter((shape) => shape.kind === "pipe")) {
    for (const end of [pipe.from, pipe.to]) {
      if (end?.id !== undefined) link(pipe.id, end.id);
      else if (end?.pipe !== undefined) link(pipe.id, end.pipe);
    }
  }
  return links;
}

function mediaOf(shape, links, byId){
  return [...(links.get(shape.id) ?? [])].map((id) => byId.get(id)).filter((entry) => entry?.kind === "pipe").map((pipe) => mediumOf(pipe.medium).id);
}

function gatewayFor(device, links, byId){
  const seen = new Set([device.id]);
  const queue = [device.id];
  while (queue.length) {
    const id = queue.shift();
    for (const next of links.get(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      const shape = byId.get(next);
      const kind = kindOf(shape);
      if (kind === "gateway") return shape;
      if (kind === "hub" || kind === "ip") continue;
      queue.push(next);
    }
  }
  return null;
}

export function connectConfig(shapes, { adapter = "" } = {}){
  const byId = new Map(shapes.map((shape) => [shape.id, shape]));
  const links = graph(shapes);
  const sections = [];
  const skipped = [];
  const used = new Map();
  const unique = (name, group = "") => {
    const key = `${group}.${name}`.toLowerCase();
    const count = (used.get(key) ?? 0) + 1;
    used.set(key, count);
    const unit = count === 1 ? name : `${name}_${count}`;
    return group ? `${group}.${unit}` : unit;
  };

  const devices = shapes.filter((shape) => kindOf(shape) === "ip" || kindOf(shape) === "rtu")
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const device of devices) {
    const label = device.name || HYDRONIC_ELEMENTS[device.type].label;
    const media = mediaOf(device, links, byId);
    if (kindOf(device) === "ip") {
      const ip = String(device.params?.ip ?? "").trim();
      if (media.length && !media.includes("modbusTcp")) {
        skipped.push(`${label}: ${mediumOf(media[0]).label} is not supported yet`);
        continue;
      }
      if (!ip) {
        skipped.push(`${label}: no IP address`);
        continue;
      }
      sections.push({ name: unique(connectionName(label)), device, ip, port: device.params?.port ?? 502 });
      continue;
    }
    const gateway = gatewayFor(device, links, byId);
    const ip = String(gateway?.params?.ip ?? "").trim();
    if (!gateway) {
      skipped.push(`${label}: not connected to a gateway`);
      continue;
    }
    if (!ip) {
      skipped.push(`${label}: its gateway ${gateway.name || "Gateway"} has no IP address`);
      continue;
    }
    sections.push({ name: unique(connectionName(label), groupName(gateway.name || "Gateway")), device, ip, port: gateway.params?.port ?? 502 });
  }

  const blocks = [STATION, ...SYSTEM_SECTIONS, ...sections.map((section) => modbusSection(section.name, section.ip, section.port, section.device.params?.slave ?? 1, adapter))];
  const text = blocks.map((lines) => lines.join(NL) + NL + SEPARATOR + NL).join("");
  return { text, connections: sections.map((section) => section.name), skipped };
}

export function connectFiles(shapes, options){
  const result = connectConfig(shapes, options);
  return {
    ...result,
    files: [
      { name: "DeviceConfig.netparameter", data: result.text },
      { name: "StatusVariables.ini", data: "[New variable table]\n" },
      { name: "ItemRedirect.Symbol", data: "[]\n" }
    ]
  };
}

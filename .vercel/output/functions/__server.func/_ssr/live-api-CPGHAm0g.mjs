import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-BVavKLp_.mjs";
// node_modules/.nitro/vite/services/ssr/assets/live-api-CPGHAm0g.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var resendDeveloperPush = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(() => ({})).handler(createSsrRpc("870ee7f6ad0192fac4aef82b0b1bf9f9491096bb9a039a7b3caa2debc9cfb6fb"));
var submitProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("795d2dfd88be129cbc21363762908a6d2522ce6e140aeea7d395dad416a09288"));
var syncLive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("9f92a4d03eaad67fcfe0608bdf4fd72c9e035b9e1a5eedde5ef6b631a0e18b06"));
/**
* Algoritmo de Match Direto (Modelo "Pesca" / Disparo Simultâneo para os 5 motoristas):
* O pedido aberto ('open') é exibido simultaneamente para todos os motoristas livres.
* O primeiro que aceitar na tela assume a corrida.
*/
var requestTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("e51757db75e422e949ee0e31bd83b1b3ffb42649453b2087e31c0f5cf885387c"));
/**
* Modelo "Pesca" / Disparo Simultâneo:
* Qualquer um dos 5 motoristas aprovados da frota que clicar primeiro assume a corrida.
*/
var acceptTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("84038b8fe5e09ebe23acf7a4f3d08c8a6edc71bede65677cd31190bbf5b0965d"));
var setTripStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("9e06b043a53f2f14fff17ba04319d6e689c366aa06bbaab435b300b61c7dcd74"));
var reviewList = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("cbb75616bdaa9a4a21b5c2958c01c9affc0541a677013764d70e2e07355b88df"));
var reviewDecide = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("327c2b15651ac192c904a6fb119d7db2bb7a4027b2de920e10320782fa8d6df1"));
var listChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("12bc8d4171b68a700fc54ab6f6061ed11d4b0327378a1105fed277a36f44132d"));
var sendChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("7833d2c9fc5a641ad3804fecd7659f3dda9ed151aca316273fe7cd10b639d3c8"));
var fleetList = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("316b6f7714d4fd4887380da5dfc1d0df655473325cee7cef8c5aa595abb2a060"));
var setFleetState = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("df1447541bd1fde8533519e7dfe8b1c4cd2734893159e9fe20079fa553701ac3"));
var declineTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("05d12347b61689eef3f19dd9d53c85df483e32e3b936c29a29e86e35af3eab53"));
var raisePanic = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("ad5811adb14f74d98ffeb68b5c89ade28c1467099aaa57ebf58bbd67047658ba"));
var rateTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("839e3d5aa78c3b6c59caeeba10185ca80c5b2a06761f19de4ef28a3ce24f14e8"));
var tripHistory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(() => ({})).handler(createSsrRpc("1dab4d8aaec49cd61a4dc813c8bc9883c2a47b6615c606dc2405ece9e9dc053a"));
var opsBoard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("11a032e02e58f5c8b03660d4f0c4e9ff4e8109c9c407eb3c5dec400818809789"));
var verifyTripPayment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("b3a8133947531313b12382044b24d65bf943d98a2a7abc0f51ed48e723bd58e5"));
var setDriverHotspot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("bcc56d79d9b464b7f81ac1ec349b9a33964d14b9030ffa19b08b98dba39fbd10"));
var submitMvpFeedback = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("fcecd228521cc41c12c8a6b5a0c684dfae87cebf867e5c941dd268116cdb8d21"));
var topUp = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("23d2f53bb929affe942f48522da29bb66f652d956cade175d1e572c87e663e4f"));
var sharedTrip = createServerFn({ method: "GET" }).validator((token) => token.trim()).handler(createSsrRpc("41d15f54b06a59f615530a3a39b0ffb267460612f75467ac27d6d260161622cc"));
var submitRoadReport = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("70344ce1a72d9420319ec2e9c718ebdd02a31650b52ac8211ec47f2679975ff7"));
var voteRoadReport = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("5703a9b674bd2ed70685954947ab6440783a6bcf7e0560315137e24d0d943e92"));
var setCityWeather = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("bda24f0cb2976ceab9c302e4a17ed6dfe59841e780b4230e1902e622be8b0ed0"));
export { tripHistory as C, topUp as S, voteRoadReport as T, sharedTrip as _, opsBoard as a, submitRoadReport as b, requestTrip as c, reviewList as d, sendChat as f, setTripStatus as g, setFleetState as h, listChat as i, resendDeveloperPush as l, setDriverHotspot as m, declineTrip as n, raisePanic as o, setCityWeather as p, fleetList as r, rateTrip as s, acceptTrip as t, reviewDecide as u, submitMvpFeedback as v, verifyTripPayment as w, syncLive as x, submitProfile as y };

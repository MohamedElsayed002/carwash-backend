const Payment = require('../payment/payment.model')
const Package = require("../package/package.model");
const Car = require("../car/car.model");
const UserPackage = require("../package/userPackage.model");
const { generateQRCode } = require("../../services/barcode");
const User = require("../user/user.model");
const { sendNotification } = require("../../services/notification");
const axios = require("axios");
var querystring = require('querystring');
var crypto = require('crypto');

var https = require('https');



// Use the same entityId and accessToken as the working HTML code
const ENTITY_ID = "8ac7a4c897f92ba00198037be75705a7";
const ACCESS_TOKEN =
  "OGFjN2E0Yzg5N2Y5MmJhMDAxOTgwMzdiOTFlYzA1YTN8NWEjekt5d00yUFJiYWVnakthNDU=";
const isTest = true;
const password = 'ZR9zWyRP';
const userId = '8a8294175060823a015060866a48002c';



// exports.testPayment = async (req,res) => {
//   request(function(responseData) {
//     console.log(responseData.id)
//     const id = responseData.id
//     res.render('home',{checkoutId: id})
//   })
// }

// function request(callback) {
//   const host = isTest ? 'test.oppwa.com' : 'oppwa.com'
//   const random = Math.random() * ( 1000 - 50) + 1000
//   var path = '/v1/checkouts'
//   var data = querystring.stringify({
//     'authentication.userId': userId,
//     'authentication.password': password,
//     'authentication.entityId': ENTITY_ID,
//     amount: '1.00',
//     currency: 'SAR',
//     'paymentType' : 'DB',
// 		merchantTransactionId: random,
//     'customer.email': 'test@test.com',
//     testMode: 'EXTERNAL'
//   })


//   var options = {
//     port: 443,
//     host: host,
//     path: path,
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded',
//       'Content-Length': data.length
//     }
//   }

//   var postRequest = https.request(options,function(res) {
//     res.setEncoding('utf8')
//     res.on('data',function(chunk) {
//       jsonRes = JSON.parse(chunk)
//       return callback(jsonRes)
//     })
//   })
//   postRequest.write(data)
//   postRequest.end()
  
// }


// function resultRequest(resourcePath,callback) {
//   var path = resourcePath
//   path += '?authentication.userId=' + userId;
// 	path += '&authentication.password=' + passsword;
// 	path += '&authentication.entityId=' + ENTITY_ID;

//   const host = isTest ? 'test.oppwa.com' : 'oppwa.com'

//   const url = 'https://test.oppwa.com' + path

//   axios.get(url).then(function(response) {
//     try {
//       resDate = JSON.parse(response)
//     }catch(e) {
//       resData = response 
//       console.log(resData.data.id)
//     }

//     return callback(resData)
//   }).catch(function(error) {
//     console.log(error)
//   })
// }

// exports.showHome = (req,res) => {
//   res.render('home')
// }

// exports.status = async (req,res) => {
//   resultRequest(req.query.resourcePath,function(responseData) {
//     const resultCode = responseData.result.code 
//     const successPattern = /(000\.000\.|000\.100\.1|000\.[36])/;
// 		const manuallPattern = /(000\.400\.0[^3]|000\.400\.100)/;
// 		const match1 = successPattern.test(resultCode);
// 		const match2 = manuallPattern.test(resultCode);

//     if (match1 || match2) {
// 			res.render('result', { message: 'Payment is Successful' });
// 		} else {
// 			res.render('result', { message: 'Payment is Rejected' });
// 		}
//   })
// }


// exports.webhook = async (req,res) => {
// 	var secretFromConfiguration = 'C66C535F0D3612EE663F52A8BF7CD2C861F3EB4F225B5DB03FFD0B88A99CEEB9';

// 	// Data from server
// 	var ivfromHttpHeader = '11E2A46B0D63CE87EB06A6A6';
// 	var authTagFromHttpHeader = 'A5AAF62871EC9C573BBEC4927151B347';
// 	var httpBody =
// 		'CBF1C3F9EDE91751EFF95C4630047236DE6730C6A080A188F38E3FA41D00D9FF930C2E200376D6C6EAB72EE458D7C3A61F18111AB3B77A4E6DF095D13B5F350CD3F2CAE1F4D9F3945192D42FCA883A5F06539EC4C5605D87CB055B44BE3CE3AB91451CFE4E90F0592D57283CF3E1CAEDF2B81B7E5FEA11559AD6713B97C307C792E055114F9583F968EAEAA291F985E1340A67A065966C213F6596BA474C360267C147573B8518112CB76EA3A36B508FDC7541CFE62134924EF7A09B00B3CA7F147C08AE6B88B3FD68359D87AC5909343BE451D88C8573A095716FFB4CEB274EAD88B96BBBA5ED54AE0E8FCB3F99905766AE3504EAFB7E92D9BD16B7F2E3EA8BCDC326F14F9AC0A43D75603CAA3B778CF81E5163C0C163FCA09862DDD2437DD0EB09F5B723F939CF64EE886F9A0EFD74E589147DDF41F3BEA2AFE056D6EF812E0630E79C17C9C9B81A4E56335EDFF9D5B7FA9EF28DF469790EB16457D1B7F0A706C99D4554AF32EB5A4FA2316647DC39894E5FBC27B169DE9011A717E112E4A53E7889ECCAF7D864A2C4D5C3669804EE9F01E9C5F84BA92433025AF6162D8E6BED0005B4454C5DB1B2C15E2260E28F0371E21124608B917620C31725423DAFF3627F5873E9FE9C3664A9FAD8005A43E7CB61C585AC74421824A315B60C06033FDD7CDBE902FD5B7C86BC2003F30673B092269215F43D7BB00AFF7C3F06FE25E43104DE1BEE18D024107789E9E21F18312CB5C66306C125651A9B3C41BE6A8341591E79D0D931268AF9179C221EA87A7132AEF0F8BCBF7818D38D27DF0E14AFFF4DD4699955C134844F56C6994E30EA654772B84CCDEDB41C1DCA8A23ACD55E5BCD3D1E31282964DE1BDE358F4D7E5BBA429B55F53763AC6D1C47369E7F7560E6BD028CDA8464D8280E875571ADCC91B5289C183BE0949C401DDF9CFD560AA74D2F5F0AED4988DA83EC1EC426AB689836134AE472155B9B78D21DB57341CE0467894DB7D0EA881448F7783BA8DD5A4BACB2F4E1334ABF7EBA20592B9A19C803ACC77263A36A9C3967ECC5ABACE975B90307B022562CCEC1EF7804D973345D5B9C535D364299633247D9C0AE2372F06486F00F128139A5F008AE6121046163019E6A72D943D98B23C16704C7AE1596F7ADB144592F19DAE1DBEF4FF3F89D0E0A1F1448813E8DC0F6C7B5944E4478B9A554627AAF32A60B7DF2A821EAA13595804E51DBD8F96041D0E5A894382A1A98F82CE17C95B2703A8A6B0846EA2FE58436B8795BA3A68ABBBFF3AF5FE73BC835260E3423EC83C231E07251B8D587F2FC30B7A6C1A84BB30750C1E32CFEDB9FECD5F9EF71549B58E69164D9E37DEBB56218AAF2C5F8993A1215ED07B0F2187C75FE429FA0EBE8372DE3F64EBD241DD522AC84DAEF332477619F06646AAC59656AE27CCD23F90246C32A1797CE555B5D2CAB07580E5AA8084AAC076AFE295727D740FAD1E0E96F621EA7AA6E7C09B90AC035653B6EB5255E6BB812D6544DBD585513C8D54B42DCDE019530A3918CBAF2A6170B1B5D582987424C29FB14D1BD657B133F4BC48DA2CDBDDD05C9CA9FA99E09401AF06BB2D768C9BC5C0184A482B065BF688E3DBD5FFE6525D8CA03F75D71DB03EC1ADF8F96D1F5FD495A6FB1667A6474637AD95DA08F44106228C4CBA5C81B28222E82C42F1B473D46947043DBAE050CA3C7FC2571283D7439FA1804206C2EEBA6E95C6247E4C42CF6C5F34ABDD2B1B61D521DC368C0588F665F3E189B3513F027575CEB1523B68F76BFF1EA7871E4BEA29A4F03FDA07662';

// 	// Convert data to process
// 	var key = new Buffer(secretFromConfiguration, 'hex');
// 	var iv = new Buffer(ivfromHttpHeader, 'hex');
// 	var authTag = new Buffer(authTagFromHttpHeader, 'hex');
// 	var cipherText = new Buffer(httpBody, 'hex');

// 	// Prepare descryption
// 	var decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
// 	decipher.setAuthTag(authTag);

// 	// Decrypt
// 	var result = decipher.update(cipherText) + decipher.final();
// 	console.log(result);
// }

// exports.createPayment = async (req, res) => {
//   try {
//     const { package: packageId, car: carId, amount, method } = req.body;
//     // Validate car
//     const car = await Car.findOne({ _id: carId, user: req.user._id });
//     if (!car) return res.status(400).json({ error: "Car not found" });
//     // Validate package
//     const pkg = await Package.findById(packageId);
//     if (!pkg) return res.status(400).json({ error: "Package not found" });
//     // Enforce car size
//     if (car.size !== pkg.size) {
//       return res
//         .status(400)
//         .json({ error: "Car size does not match package size" });
//     }
//     // Create payment
//     const payment = new Payment({
//       user: req.user._id,
//       package: packageId,
//       amount,
//       method,
//       status: "completed",
//     });
//     await payment.save();
//     // Generate unique barcode string
//     const barcode = crypto.randomBytes(12).toString("hex");
//     // Generate QR code image
//     const barcodeImage = await generateQRCode(barcode);
//     // Calculate expiry
//     const expiry = new Date();
//     expiry.setDate(expiry.getDate() + pkg.duration);
//     // Create UserPackage
//     const userPackage = new UserPackage({
//       user: req.user._id,
//       package: packageId,
//       carSize: car.size, // Use car's size instead of car ID
//       barcode,
//       barcodeImage,
//       washesLeft: pkg.washes,
//       expiry,
//       status: "active",
//     });
//     await userPackage.save();

//     // Referral reward logic: reward inviter with 2 free washes on first purchase
//     const userPackagesCount = await UserPackage.countDocuments({
//       user: req.user._id,
//     });
//     if (userPackagesCount === 1 && req.user.referredBy) {
//       // Find the referral record
//       const referral = await Referral.findOne({
//         invitee: req.user._id,
//         status: "pending",
//       });
//       if (referral) {
//         // Find inviter's most recent active UserPackage
//         let inviterPackage = await UserPackage.findOne({
//           user: req.user.referredBy,
//           status: "active",
//         }).sort({ createdAt: -1 });
//         if (inviterPackage) {
//           inviterPackage.washesLeft += 2;
//           await inviterPackage.save();
//         } else {
//           // Create a new reward package for inviter if none exists
//           const rewardExpiry = new Date();
//           rewardExpiry.setDate(rewardExpiry.getDate() + 30);
//           const rewardPackage = new UserPackage({
//             user: req.user.referredBy,
//             package: packageId, // or a special reward package if you want
//             carSize: car.size, // Use car's size for reward
//             barcode: crypto.randomBytes(12).toString("hex"),
//             barcodeImage: "",
//             washesLeft: 2,
//             expiry: rewardExpiry,
//             status: "active",
//           });
//           await rewardPackage.save();
//         }
//         // Add 2 free washes to the referred user's new package
//         userPackage.washesLeft += 2;
//         await userPackage.save();
//         referral.status = "rewarded";
//         referral.rewardGiven = true;
//         await referral.save();
//         // Send notifications to inviter and referred user
//         await sendNotification({
//           user: req.user.referredBy,
//           type: "referral",
//           message: "لقد حصلت على غسلتين مجانيتين كمكافأة لإحالة صديق!",
//         });
//         await sendNotification({
//           user: req.user._id,
//           type: "referral",
//           message:
//             "لقد حصلت على غسلتين مجانيتين كمكافأة على أول عملية شراء لك!",
//         });
//       }
//     }

//     res.status(201).json({ payment, userPackage });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// exports.getPayments = async (req, res) => {
//   try {
//     const payments = await Payment.find({ user: req.user._id }).populate(
//       "package"
//     );
//     res.json(payments);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.getPayment = async (req, res) => {
//   try {
//     const payment = await Payment.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     }).populate("package");
//     if (!payment) return res.status(404).json({ error: "Payment not found" });
//     res.json(payment);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.updatePayment = async (req, res) => {
//   try {
//     const payment = await Payment.findOneAndUpdate(
//       { _id: req.params.id, user: req.user._id },
//       req.body,
//       { new: true }
//     );
//     if (!payment) return res.status(404).json({ error: "Payment not found" });
//     res.json(payment);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// exports.deletePayment = async (req, res) => {
//   try {
//     const payment = await Payment.findOneAndDelete({
//       _id: req.params.id,
//       user: req.user._id,
//     });
//     if (!payment) return res.status(404).json({ error: "Payment not found" });
//     res.json({ message: "Payment deleted" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// HyperPay checkout session creation
// exports.createHyperpayCheckout = async (req, res) => {
//   try {
//     const {
//       amount,
//       currency,
//       merchantTransactionId,
//       customerEmail,
//       billingStreet1,
//       billingCity,
//       billingState,
//       billingCountry,
//       billingPostcode,
//       customerGivenName,
//       customerSurname
//     } = req.body;

//     const data = new URLSearchParams({
//       entityId: ENTITY_ID,
//       amount,
//       currency,
//       paymentType: 'DB',
//       testMode: 'EXTERNAL',
//       'customParameters[3DS2_enrolled]': 'true',
//       merchantTransactionId,
//       'customer.email': customerEmail,
//       'billing.street1': billingStreet1,
//       'billing.city': billingCity,
//       'billing.state': billingState,
//       'billing.country': billingCountry,
//       'billing.postcode': billingPostcode,
//       'customer.givenName': customerGivenName,
//       'customer.surname': customerSurname
//     });

//     const response = await axios.post(
//       'https://eu-test.oppwa.com/v1/checkouts',
//       data,
//       {
//         headers: {
//           Authorization: `Bearer ${ACCESS_TOKEN}`,
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       }
//     );

//     res.json(response.data);
//   } catch (error) {
//     res.status(500).json({ error: error.response?.data || error.message });
//   }
// };

// exports.createHyperpayCheckout = async (req, res) => {
//   try {
//     const {
//       amount,
//       currency,
//       customerEmail,
//       billingStreet1,
//       billingCity,
//       billingState,
//       billingCountry,
//       billingPostcode,
//       customerGivenName,
//       customerSurname,
//     } = req.body;

//     const merchantTransactionId = `TX-${Date.now()}-${Math.floor(
//       Math.random() * 10000
//     )}`;

//     const data = new URLSearchParams({
//       entityId: ENTITY_ID,
//       amount,
//       currency,
//       paymentType: "DB",
//       testMode: "EXTERNAL",
//       "customParameters[3DS2_enrolled]": "true",
//       merchantTransactionId,
//       "customer.email": customerEmail,
//       "billing.street1": billingStreet1,
//       "billing.city": billingCity,
//       "billing.state": billingState,
//       "billing.country": billingCountry,
//       "billing.postcode": billingPostcode,
//       "customer.givenName": customerGivenName,
//       "customer.surname": customerSurname,
//     });

//     const response = await axios.post(
//       "https://eu-test.oppwa.com/v1/checkouts",
//       data,
//       {
//         headers: {
//           Authorization: `Bearer ${ACCESS_TOKEN}`,
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//       }
//     );
//     res.json({ ...response.data, merchantTransactionId });
//   } catch (error) {
//     res.status(500).json({ error: error.response?.data || error.message });
//   }
// };

// // Test endpoint for payment result (for debugging)
// exports.testPaymentResult = async (req, res) => {
//   try {
//     console.log("Test payment result handler called");
//     console.log("Query params:", req.query);

//     const { id: transactionId, resourcePath } = req.query;

//     if (!transactionId) {
//       return res.status(400).json({ error: "Transaction ID is required" });
//     }

//     // For testing, just return the parameters we received
//     return res.status(200).json({
//       success: true,
//       transactionId,
//       resourcePath,
//       decodedResourcePath: decodeURIComponent(resourcePath),
//       message: "Test endpoint - parameters received successfully",
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Test payment result error:", error);
//     return res.status(500).json({
//       error: "Test endpoint error",
//       details: error.message,
//     });
//   }
// };

// // HyperPay payment result handler
// exports.handlePaymentResult = async (req, res) => {
//   try {
//     console.log("Payment result handler called");
//     console.log("Query params:", req.query);
//     console.log("Headers:", req.headers);

//     const { id: transactionId, resourcePath } = req.query;

//     if (!transactionId) {
//       console.log("No transaction ID provided");
//       return res.status(400).json({ error: "Transaction ID is required" });
//     }

//     console.log("Processing transaction:", transactionId);
//     console.log("Resource path:", resourcePath);

//     // Decode the resourcePath if it's URL-encoded
//     const decodedResourcePath = decodeURIComponent(resourcePath);
//     console.log("Decoded resource path:", decodedResourcePath);

//     // Verify payment status with HyperPay
//     const hyperpayUrl = `https://eu-test.oppwa.com${decodedResourcePath}`;
//     console.log("Calling HyperPay URL:", hyperpayUrl);

//     const response = await axios.get(hyperpayUrl, {
//       headers: {
//         Authorization: `Bearer ${ACCESS_TOKEN}`,
//       },
//       params: {
//         entityId: ENTITY_ID, // Add the required entityId
//       },
//     });

//     console.log("HyperPay response status:", response.status);
//     console.log("HyperPay response data:", response.data);

//     const paymentStatus = response.data.result.code;
//     const paymentMessage = response.data.result.description;

//     // Check if payment was successful - HyperPay success codes
//     const successCodes = [
//       "000.100.110", // Success
//       "000.000.000", // Success
//       "000.100.112", // Success (Connector Test Mode)
//       "000.200.000", // Success
//       "800.400.500", // Success (for some payment types)
//       "800.400.501", // Success (for some payment types)
//       "800.400.502", // Success (for some payment types)
//     ];

//     if (successCodes.includes(paymentStatus)) {
//       // Payment successful - create payment record and user package
//       console.log("Payment successful, creating records...");

//       try {
//         // Check database connection
//         const mongoose = require("mongoose");
//         console.log(
//           "Database connection state:",
//           mongoose.connection.readyState
//         );
//         if (mongoose.connection.readyState !== 1) {
//           console.error("Database not connected!");
//           throw new Error("Database connection not ready");
//         }

//         // For now, we'll create a basic payment record
//         // In a real implementation, you'd get the order details from session or database
//         const userId = req.query.userId || "64f1a2b3c4d5e6f7a8b9c0d1"; // Default user ID for testing
//         const packageId = req.query.packageId || "64f1a2b3c4d5e6f7a8b9c0d2"; // Default package ID for testing
//         const carSize = req.query.carSize;

//         // Validate carSize
//         const allowedCarSizes = ["sedan", "suv", "truck", "van", "luxury"];
//         if (!carSize || !allowedCarSizes.includes(carSize)) {
//           return res.status(400).json({
//             success: false,
//             transactionId,
//             status: "error",
//             message:
//               "carSize is required and must be one of: " +
//               allowedCarSizes.join(", "),
//           });
//         }

//         console.log("Received IDs:", { userId, packageId, carSize });

//         // Validate that the IDs are valid MongoDB ObjectIds or handle string IDs
//         const isValidObjectId = (id) => {
//           return mongoose.Types.ObjectId.isValid(id);
//         };

//         // If the IDs are not valid ObjectIds, we'll use default ones for demo purposes
//         const finalUserId = isValidObjectId(userId)
//           ? userId
//           : "64f1a2b3c4d5e6f7a8b9c0d1";
//         const finalPackageId = isValidObjectId(packageId)
//           ? packageId
//           : "64f1a2b3c4d5e6f7a8b9c0d2";

//         console.log("Final IDs:", { finalUserId, finalPackageId });

//         const paymentData = {
//           user: finalUserId,
//           package: finalPackageId,
//           amount: parseFloat(response.data.amount) || 225.0,
//           method: "hyperpay",
//           status: "completed",
//           transactionId: transactionId,
//           paymentDetails: response.data,
//         };

//         console.log("Payment data to save:", paymentData);

//         // Test database operations first
//         console.log("Testing database operations...");
//         try {
//           const testPayment = new Payment({
//             user: finalUserId,
//             package: finalPackageId,
//             amount: 1.0,
//             method: "test",
//             status: "completed",
//             transactionId: "test-" + Date.now(),
//           });
//           await testPayment.save();
//           console.log("Test payment saved successfully:", testPayment._id);
//           await Payment.findByIdAndDelete(testPayment._id);
//           console.log("Test payment deleted successfully");
//         } catch (testError) {
//           console.error("Test database operation failed:", testError);
//           throw testError;
//         }

//         // Test UserPackage model
//         console.log("Testing UserPackage model...");
//         try {
//           const testUserPackage = new UserPackage({
//             user: finalUserId,
//             package: finalPackageId,
//             carSize: carSize,
//             barcode: "test-barcode-" + Date.now(),
//             barcodeImage: "",
//             washesLeft: 1,
//             expiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
//             status: "active",
//           });
//           await testUserPackage.save();
//           console.log(
//             "Test UserPackage saved successfully:",
//             testUserPackage._id
//           );
//           await UserPackage.findByIdAndDelete(testUserPackage._id);
//           console.log("Test UserPackage deleted successfully");
//         } catch (testError) {
//           console.error("Test UserPackage operation failed:", testError);
//           throw testError;
//         }

//         // Create payment record
//         const payment = new Payment(paymentData);
//         console.log("Payment model created, attempting to save...");
//         await payment.save();
//         console.log("Payment record created successfully:", payment._id);

//         // Get package details for user package creation
//         console.log("Looking for package with ID:", finalPackageId);
//         const pkg = await Package.findById(finalPackageId);
//         if (!pkg) {
//           console.log("Package not found, using default values");
//         } else {
//           console.log("Package found:", pkg.name);
//         }

//         // Generate unique barcode string
//         const barcode = crypto.randomBytes(12).toString("hex");
//         console.log("Generated barcode:", barcode);

//         // Generate QR code image
//         console.log("Generating QR code...");
//         let barcodeImage;
//         try {
//           barcodeImage = await generateQRCode(barcode);
//           console.log("QR code generated successfully");
//         } catch (qrError) {
//           console.error("QR code generation failed:", qrError);
//           barcodeImage = ""; // Use empty string as fallback
//         }

//         // Calculate expiry
//         const expiry = new Date();
//         const durationDays = pkg ? pkg.duration : 30; // Default 30 days if package not found
//         expiry.setDate(expiry.getDate() + durationDays);
//         console.log("Expiry date calculated:", expiry);

//         // Create UserPackage
//         const userPackageData = {
//           user: finalUserId,
//           package: finalPackageId,
//           carSize: carSize, // Use carSize from request
//           barcode,
//           barcodeImage,
//           washesLeft: pkg ? pkg.washes : 5, // Default 5 washes if package not found
//           expiry,
//           status: "active",
//         };

//         console.log("UserPackage data to save:", userPackageData);

//         const userPackage = new UserPackage(userPackageData);
//         console.log("UserPackage model created, attempting to save...");
//         await userPackage.save();
//         console.log("UserPackage created successfully:", userPackage._id);

//         // Handle referral rewards if this is the user's first purchase
//         const userPackagesCount = await UserPackage.countDocuments({
//           user: finalUserId,
//         });

//         if (userPackagesCount === 1) {
//           console.log(
//             "First purchase detected, checking for referral rewards..."
//           );
//           // Find the user to check if they were referred
//           const user = await User.findById(finalUserId);
//           if (user && user.referredBy) {
//             console.log("User was referred, processing rewards...");
//             const referral = await Referral.findOne({
//               invitee: finalUserId,
//               status: "pending",
//             });
//             if (referral) {
//               // Add 2 free washes to inviter
//               let inviterPackage = await UserPackage.findOne({
//                 user: user.referredBy,
//                 status: "active",
//               }).sort({ createdAt: -1 });
//               if (inviterPackage) {
//                 inviterPackage.washesLeft += 2;
//                 await inviterPackage.save();
//                 console.log("Added 2 washes to inviter package");
//               } else {
//                 // Create reward package for inviter
//                 const rewardExpiry = new Date();
//                 rewardExpiry.setDate(rewardExpiry.getDate() + 30);
//                 const rewardPackage = new UserPackage({
//                   user: user.referredBy,
//                   package: finalPackageId,
//                   carSize: carSize, // Default car size for reward
//                   barcode: crypto.randomBytes(12).toString("hex"),
//                   barcodeImage: "",
//                   washesLeft: 2,
//                   expiry: rewardExpiry,
//                   status: "active",
//                 });
//                 await rewardPackage.save();
//                 console.log("Created reward package for inviter");
//               }

//               // Add 2 free washes to the referred user's new package
//               userPackage.washesLeft += 2;
//               await userPackage.save();
//               console.log("Added 2 washes to referred user package");

//               // Update referral status
//               referral.status = "rewarded";
//               referral.rewardGiven = true;
//               await referral.save();
//               console.log("Updated referral status to rewarded");

//               // Send notifications
//               await sendNotification({
//                 user: user.referredBy,
//                 type: "referral",
//                 message: "لقد حصلت على غسلتين مجانيتين كمكافأة لإحالة صديق!",
//               });
//               await sendNotification({
//                 user: finalUserId,
//                 type: "referral",
//                 message:
//                   "لقد حصلت على غسلتين مجانيتين كمكافأة على أول عملية شراء لك!",
//               });
//               console.log("Referral notifications sent");
//             }
//           }
//         }

//         console.log("Payment successful");
//         return res.redirect(
//           "https://mellifluous-eclair-f3f079.netlify.app/payment-result.html?status=success"
//         );
//       } catch (dbError) {
//         console.error("Database error creating records:", dbError);
//         return res.status(500).json({
//           success: false,
//           transactionId,
//           status: "error",
//           message: "Payment verified but failed to create records",
//           details: dbError.message,
//         });
//       }
//     } else {
//       // Payment failed
//       console.log("Payment failed:", paymentStatus);
//       return res.redirect(
//         "https://mellifluous-eclair-f3f079.netlify.app/payment-result.html?status=fail"
//       );
//     }
//   } catch (error) {
//     console.error("Payment result handler error:", error);
//     console.error("Error response:", error.response?.data);
//     console.error("Error status:", error.response?.status);

//     // If HyperPay returns an error, we should still return a proper response
//     if (error.response?.data) {
//       return res.status(400).json({
//         success: false,
//         transactionId: req.query.id,
//         status: "error",
//         message: "Payment verification failed",
//         details: error.response.data,
//       });
//     }

//     return res.status(500).json({
//       error: "Failed to process payment result",
//       details: error.message,
//     });
//   }
// };

// // Create payment from HyperPay result
// exports.createPaymentFromHyperPay = async (req, res) => {
//   try {
//     const {
//       transactionId,
//       package: packageId,
//       car: carId,
//       amount,
//       method = "hyperpay",
//     } = req.body;

//     // Validate car
//     const car = await Car.findOne({ _id: carId, user: req.user._id });
//     if (!car) return res.status(400).json({ error: "Car not found" });

//     // Validate package
//     const pkg = await Package.findById(packageId);
//     if (!pkg) return res.status(400).json({ error: "Package not found" });

//     // Enforce car size
//     if (car.size !== pkg.size) {
//       return res
//         .status(400)
//         .json({ error: "Car size does not match package size" });
//     }

//     // Create payment record
//     const payment = new Payment({
//       user: req.user._id,
//       package: packageId,
//       amount,
//       method,
//       status: "completed",
//       transactionId, // Store HyperPay transaction ID
//     });
//     await payment.save();

//     // Generate unique barcode string
//     const barcode = crypto.randomBytes(12).toString("hex");

//     // Generate QR code image
//     const barcodeImage = await generateQRCode(barcode);

//     // Calculate expiry
//     const expiry = new Date();
//     expiry.setDate(expiry.getDate() + pkg.duration);

//     // Create UserPackage
//     const userPackage = new UserPackage({
//       user: req.user._id,
//       package: packageId,
//       carSize: car.size, // Use car's size instead of car ID
//       barcode,
//       barcodeImage,
//       washesLeft: pkg.washes,
//       expiry,
//       status: "active",
//     });
//     await userPackage.save();

//     // Handle referral rewards (same logic as before)
//     const userPackagesCount = await UserPackage.countDocuments({
//       user: req.user._id,
//     });
//     if (userPackagesCount === 1 && req.user.referredBy) {
//       const referral = await Referral.findOne({
//         invitee: req.user._id,
//         status: "pending",
//       });
//       if (referral) {
//         let inviterPackage = await UserPackage.findOne({
//           user: req.user.referredBy,
//           status: "active",
//         }).sort({ createdAt: -1 });
//         if (inviterPackage) {
//           inviterPackage.washesLeft += 2;
//           await inviterPackage.save();
//         } else {
//           const rewardExpiry = new Date();
//           rewardExpiry.setDate(rewardExpiry.getDate() + 30);
//           const rewardPackage = new UserPackage({
//             user: req.user.referredBy,
//             package: packageId,
//             carSize: car.size, // Use car's size for reward
//             barcode: crypto.randomBytes(12).toString("hex"),
//             barcodeImage: "",
//             washesLeft: 2,
//             expiry: rewardExpiry,
//             status: "active",
//           });
//           await rewardPackage.save();
//         }
//         userPackage.washesLeft += 2;
//         await userPackage.save();
//         referral.status = "rewarded";
//         referral.rewardGiven = true;
//         await referral.save();
//         await sendNotification({
//           user: req.user.referredBy,
//           type: "referral",
//           message: "لقد حصلت على غسلتين مجانيتين كمكافأة لإحالة صديق!",
//         });
//         await sendNotification({
//           user: req.user._id,
//           type: "referral",
//           message:
//             "لقد حصلت على غسلتين مجانيتين كمكافأة على أول عملية شراء لك!",
//         });
//       }
//     }

//     res.status(201).json({
//       success: true,
//       payment,
//       userPackage,
//       qrCode: barcode,
//       message: "Payment completed successfully",
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // Create tip payment from HyperPay result
// exports.createTipPaymentFromHyperPay = async (req, res) => {
//   try {
//     const { transactionId, station, amount, method = "hyperpay" } = req.body;
//     // Optionally validate station exists
//     // const WashStation = require('../washingPlace/washingPlace.model');
//     // const washStation = await WashStation.findById(station);
//     // if (!washStation) return res.status(400).json({ error: 'Station not found' });

//     // Create payment record
//     const payment = new Payment({
//       user: req.user._id,
//       station,
//       amount,
//       method,
//       status: "completed",
//       transactionId,
//       type: "tip",
//     });
//     await payment.save();

//     res.status(201).json({
//       success: true,
//       payment,
//       message: "Tip payment completed successfully",
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // ========================================
// // MISSING PAYMENT ENDPOINTS
// // ========================================

// // GET /api/payments/user/:userId (Get payments for specific user)
// exports.getPaymentsByUserId = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { page = 1, limit = 10, status, method } = req.query;
//     const skip = (page - 1) * limit;
    
//     const filter = { user: userId };
//     if (status) {
//       filter.status = status;
//     }
//     if (method) {
//       filter.method = method;
//     }
    
//     const payments = await Payment.find(filter)
//       .populate('package car')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));
    
//     const total = await Payment.countDocuments(filter);
    
//     res.json({
//       success: true,
//       data: {
//         payments,
//         pagination: {
//           current: parseInt(page),
//           pages: Math.ceil(total / limit),
//           total
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       error: error.message 
//     });
//   }
// };

// // POST /api/payments/:id/verify (Verify payment)
// exports.verifyPayment = async (req, res) => {
//   try {
//     const payment = await Payment.findById(req.params.id);
    
//     if (!payment) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Payment not found' 
//       });
//     }
    
//     // Check if user owns this payment
//     if (payment.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Access denied' 
//       });
//     }
    
//     // In a real implementation, you would verify with the payment provider
//     // For now, we'll just check if the payment is marked as completed
//     if (payment.status === 'completed') {
//       res.json({
//         success: true,
//         message: 'Payment verified successfully',
//         data: {
//           verified: true,
//           payment
//         }
//       });
//     } else {
//       res.json({
//         success: true,
//         message: 'Payment verification failed',
//         data: {
//           verified: false,
//           payment
//         }
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       error: error.message 
//     });
//   }
// };

// // POST /api/payments/:id/refund (Refund payment)
// exports.refundPayment = async (req, res) => {
//   try {
//     const { reason } = req.body;
    
//     const payment = await Payment.findById(req.params.id);
    
//     if (!payment) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Payment not found' 
//       });
//     }
    
//     // Check if user owns this payment
//     if (payment.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Access denied' 
//       });
//     }
    
//     // Check if payment can be refunded
//     if (payment.status !== 'completed') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Payment cannot be refunded in its current status' 
//       });
//     }
    
//     // In a real implementation, you would process the refund with the payment provider
//     // For now, we'll just update the status
//     payment.status = 'refunded';
//     payment.refundedAt = new Date();
//     payment.refundReason = reason;
//     await payment.save();
    
//     res.json({
//       success: true,
//       message: 'Payment refunded successfully',
//       data: payment
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       error: error.message 
//     });
//   }
// };

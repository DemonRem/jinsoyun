const Discord = require("discord.js");
const Twitter = require("twitter");
const ontime = require("ontime");
const fetch = require('node-fetch');

const secret = require("./secret.json");
const config = require("./config.json");
const daily = require("./daily-challenges.json");
const koldrakTime = require("./koldrak.json");

const clientDiscord = new Discord.Client();
const clientTwitter = new Twitter({
	consumer_key: secret.TWITTER_CONSUMER_KEY,
	consumer_secret: secret.TWITTER_CONSUMER_SECRET,
	access_token_key: secret.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: secret.TWITTER_ACCESS_TOKEN_SECRET
});

// Default class list
var classArr = ["blade master", "destroyer", "summoner", "force master", "kung fu master", "assassin", "blade dancer", "warlock", "soul fighter", "gunslinger"];

// Querry payload status
var payloadStatus = "rejected";
var querryStatus = false;

// Global variable
var koldrakAlertSystem = true;

// Twitter hook variables
var twtUsername;
var twtScreenName
var twtText;
var twtAvatar;
var twtCreatedAt;
var twtTimestamp;
var twtColor;
var twtFilter;

// Timer variables
var timerStartedTime;
var timerValue;
var timerStatus = false;

// silveress API point
const silveressNA = "https://api.silveress.ie/bns/v3/character/full/na/";
const silveressEU = "https://api.silveress.ie/bns/v3/character/full/eu/";

// Soyun status
var statusRandom = 0;

// Discord stuff start here
clientDiscord.on("ready", () => {
	console.log(" [ "+Date.now()+" ] > bot is alive and ready for command(s)");
	
	clientDiscord.user.setUsername("Jinsoyun");
	clientDiscord.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
});

// User joined the guild
clientDiscord.on("guildMemberAdd", (member) => {
	// Add 'cricket' role so new member so they cant access anything until they do !join for organizing reason
	member.addRole(member.guild.roles.find("name", "cricket"));
	
	// Welcoming message and guide to join
	member.guild.channels.find("name", config.DEFAULT_MEMBER_GATE).send('Hi <@'+member.user.id+'>, welcome to ***'+member.guild.name+'***!\n\nTheres one thing you need to do before you can talk with others, can you tell me your in-game nickname and your class? to do that please write ***!reg "username here" "your class here"***, here is an example how to do so: ***!reg "Jinsoyun" "Blade Master"***, thank you! ^^ \n\nIf you need some assistance you can **@mention** or **DM** available officers');

	// Console logging
	console.log(" [ "+Date.now()+" ] > "+member.user.username+" has joined");
	console.log(" [ "+Date.now()+" ] > "+member.user.username+" role is changed to 'cricket' until "+member.user.username+" do !reg");
});

// User commands
clientDiscord.on("message", (message) => {
  if (message.toString().substring(0, 1) == '!') {
        var args = message.toString().substring(1).split(' ');
        var cmd = args[0];
			cmd = cmd.toLowerCase();

        args = args.splice(1);
        switch(cmd) {
			// Connection test
			case 'soyun':
				var soyunQuerry = message.toString().substring(1).split(' ');
				var soyunHelpTxt = '> For changing nickname you can do `!username "desired username"` (it will be automatically capitalized dont worry :wink: )\n> For changing class you can do `!class "desired class"`\n> For checking today daily challenges you can do `!daily` or `!daily tomorrow` for the one from tomorrow\n> For checking next **Koldrak\'s Lair** you can do `!koldrak`\n> To roll some dice you can do `!roll` or `!roll (any start number)-(any end number)`\n> To let me pick between two things you can do `!pick "item a" or "item b"`\n> To find or look at a character you can do `!who "character name"`\n ';

				soyunQuerry = soyunQuerry.splice(1);

				switch(soyunQuerry[0]){
					case 'help':
						if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
							soyunHelpTxt = soyunHelpTxt + '\n**Admin Only**\n> For making notification you can do `!say "title" "content"`\n';
						};

						message.channel.send("Here is some stuff you can ask me to do:\n\n"+soyunHelpTxt+"\nIf you need some assistance you can **@mention** or **DM** available **officers**.");
						// Console logging
						console.log(" [ "+Date.now()+" ] > "+message+" triggered");
					break;

					case 'status':						
						switch(statusRandom){
							case 0:
								clientDiscord.user.setActivity('!soyun help', {type: 'LISTENING' });
								statusRandom = 1;
							break;
							
							case 1:
								clientDiscord.user.setActivity('with Hongmoon School', {type: 'PLAYING'});
								statusRandom = 0;
							break;
						}
					break;

					default:
						message.channel.send("Yes master?");
						// Console logging
						console.log(" [ "+Date.now()+" ] > "+message+" triggered");
				};
            break;
			
			// Server join = username change and role add
			case 'reg':
				var joinQuerry = message.toString().substring(1).split('"');
				var joinUsername = (joinQuerry[1]);
				
				try{
					var joinClass = (joinQuerry[3]);
							
					joinClass = joinClass.toLowerCase(); // Converting class value to lower case so input wont be missmatched
					
					// Checking the class input
					for(i = 0; i < classArr.length;){
						// Class input verification (inefficient af)
						if(joinClass == classArr[i]){
							querryStatus = true;
							break;
						};
						i++
					};

					// Checking the verification
					if(querryStatus == true){
						// Convert to capitalize to make it easy and 'prettier'
						joinUsername = joinUsername.replace(/\b\w/g, l => l.toUpperCase());
						
						// Setting user role to match the user class
						message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", joinClass));
						// Adding "member" role so user can talk
						message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", "member"));
						// Removing "cricket" role
						message.guild.members.get(message.author.id).removeRole(message.guild.roles.find("name", "cricket"));
						
						// Setting message author username (guild owner or lower)
						message.guild.members.get(message.author.id).setNickname(joinUsername);

						// Welcoming message on general channel
						message.guild.channels.find("name", config.DEFAULT_TEXT_CHANNEL).send("Please welcome our new "+joinClass+" ***"+joinUsername+"***!");
						payloadStatus = "received";
						querryStatus = false;
					}else{
						// Telling them whats wrong
						message.channel.send("Im sorry, i cant seems to find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
						querryStatus = false;
					}
				}catch(err){
					message.channel.send('Im sorry i cant seems to catch that can you try again?\n\nExample: **!reg "Jinsoyun" "Blade Master"**');
					payloadStatus = "rejected";
				};

				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message+" triggered, status: "+payloadStatus);
				payloadStatus = "rejected";
			break;
			
			// Username change
			case 'username':
				var usernameQuerry = message.toString().substring(1).split('"');
				var usernameValue = (usernameQuerry[1]);
				
				usernameValue = usernameValue.replace(/\b\w/g, l => l.toUpperCase());

				// Changing message author username
				message.guild.members.get(message.author.id).setNickname(usernameValue);
				message.channel.send("Your username changed to "+usernameValue);

				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message+" triggered");
			break;
			
			// Class change
			case 'class':
				var classQuerry = message.toString().substring(1).split('"');
				var classValue = (classQuerry[1]);
				var classUserRolesArr = message.author.role; // Array of author roles
				var querryStatus;
				var i; // for loop, ignore

				classValue = classValue.toLowerCase(); // Converting class value to lower case so input wont be missmatched

				// Removing user current class
				// I know this is stupid way to do it, but it have to do for now
				for(i = 0; i < classArr.length;){
					// Class input verification (inefficient af)
					if(classValue == classArr[i]){
						querryStatus = true;
						break;
					};
					message.guild.members.get(message.author.id).removeRole(message.guild.roles.find("name", classArr[i]));
					i++
				};

				// Checking the verification
				if(querryStatus == true){
					// Adding new role to user according their command
					message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", classValue));

					// Telling the user class has been changed
					message.channel.send("Your class changed to **"+classValue+"**");
					payloadStatus = "received";
					querryStatus = false;
				}else{
					// Telling them whats wrong
					message.channel.send("Im sorry, i cant seems to find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
					querryStatus = false;
				}
				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message+" triggered, status: "+payloadStatus);
				payloadStatus = "rejected";
			break;

			case 'twcon':
				// Twitter's tweet output
				clientDiscord.guilds.map((guild) => {
					let found = 0;
					guild.channels.map((ch) =>{
						if(found == 0){
							if(ch.name == config.DEFAULT_NEWS_CHANNEL){
								ch.send({
									"embed":{
										"color": twtColor,
										"timestamp" : new Date(),
										"description": twtText,
										"author":{
											"name": twtUsername,
											"url": "https://twitter.com/"+twtScreenName,
										},
										"footer":{
											"text": twtUsername,
											"icon_url": twtAvatar
										}
									}
								});
								found = 1;
							}
						}
					});
				});
				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message+" triggered");
			break;
			
			// Writing message via bot for announcement or notice, Admin only
			case 'say':
				if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
					var sayQuerry = message.toString().substring(1).split('"');

					var sayTitle = (sayQuerry[1]);
						sayTitle = sayTitle.replace(/\b\w/g, l => l.toUpperCase());

						// Default title
						if(sayTitle == ""){
							sayTitle = "Announcement";
						}

					// Writing the content
					message.guild.channels.find("name", config.DEFAULT_NEWS_CHANNEL).send({
						"embed":{
							"color": 16753920,
							"timestamp" : new Date(),
							"description": sayQuerry[3],
							"author":{
								"name": sayTitle,
							},
							"footer":{
								"text": message.author.username,
								"icon_url": message.author.avatarURL
							}
						}
					});
					payloadStatus = "recieved";
				}else{
					payloadStatus = 'rejected';
				};
				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message+" triggered, status: "+payloadStatus);
				payloadStatus = "rejected";
			break;

			// First time setup (making roles and necesarry channels), Admin only
			case 'setup':
				if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
					// Making the roles with class array as reference
					for(i = 0; i < classArr.length;){
						message.guild.createRole({
							name: classArr[i]
						}).catch(console.error);
						i++;
						// Console logging
						console.log(" [ "+Date.now()+" ] > "+classArr[i]+" role created");
					};

					// Making "news" channel
					message.guild.createChannel(config.DEFAULT_NEWS_CHANNEL, "text");
					// Console logging
					console.log(" [ "+Date.now()+" ] > "+config.DEFAULT_NEWS_CHANNEL+" channel created");
					
					payloadStatus = "recieved";
				};	
				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message+", status: "+payloadStatus);
				payloadStatus = "rejected";
			break;
			
			// pick between two things
			case 'pick':
				var pickQuerry = message.toString().substring(1).split('"');	
				var pickFirstOption = pickQuerry[1];
				var pickSecondOption = pickQuerry[3];

				var pickResult = Math.floor(Math.random() * 2);
				var pickResultValue;

				if(pickResult == 0){
					pickResultValue = pickFirstOption;
				}else{
					pickResultValue = pickSecondOption;
				};

				message.channel.send("Hmmm, I'll go with **"+pickResultValue+"**");
				
				console.log(" [ "+Date.now()+" ] > "+message+" triggered");
			break;

			// die roll
			case 'roll':
				var rollQuerry = message.toString().substring(1).split(' ');	
				var rollStartNumber
				var rollEndNumber;

				if(rollQuerry[1] == null){
					rollStartNumber = 1;
					rollEndNumber = 7;
				}else{
					rollStartNumber = rollQuerry[1].charAt(0);
					rollEndNumber = rollQuerry[1].charAt(2);
				};

				var rollResult = Math.floor(Math.random() * rollEndNumber) - rollStartNumber;

				message.channel.send("You rolled **"+rollResult+"**");

				console.log(" [ "+Date.now()+" ] > "+message+" triggered");
			break;

			// Today daily challenge
			case 'daily':
				var dcDate = new Date();
				// Getting the current date
				var dcDay = dcDate.getUTCDay();

				var dcColor;
				var dcQuests;

				var dcRewards = [];

				var dailyQuerry = message.toString().substring(1).split(' ');
				var dailyPartyAnnouncement = false;

				dailyQuerry = dailyQuerry.splice(1);
				// For checking tomorrow daily
				switch(dailyQuerry[0]){
					case 'tomorrow':
						dcDay = dcDay + 1;
					break;

					case 'announce':
						dailyPartyAnnouncement = true;
					break;

					default:
						dcDay = dcDay;
				};

				// Checking the day and inserting the payload
				switch(dcDay){
					case 0:
						// Setting the color
						dcColor = daily.sunday.color;
						// Loading the quests name and location
						dcQuests = daily.sunday.quests;
						// Loading rewards by searching the id of rewards item emoji
						for(var i = 0; i < 4;){
							dcRewards[i] = clientDiscord.emojis.find("name", daily.sunday.rewards[i]);
							i++;
						}

						// For logging
						payloadStatus = "received";
					break;

					case 1:
						dcColor = daily.monday.color;
						dcQuests = daily.monday.quests;

						for(var i = 0; i < 4;){
							dcRewards[i] = clientDiscord.emojis.find("name", daily.monday.rewards[i]);
							i++;
						}

						payloadStatus = "received";
					break;
					
					case 2:
						dcColor = daily.tuesday.color;
						dcQuests = daily.tuesday.quests;
						
						for(var i = 0; i < 4;){
							dcRewards[i] = clientDiscord.emojis.find("name", daily.tuesday.rewards[i]);
							i++;
						}

						payloadStatus = "received";
					break;

					case 3:
						dcColor = daily.wednesday.color;
						dcQuests = daily.wednesday.quests;
						
						for(var i = 0; i < 4;){
							dcRewards[i] = clientDiscord.emojis.find("name", daily.wednesday.rewards[i]);
							i++;
						}

						payloadStatus = "received";
					break;

					case 4:
						dcColor = daily.thursday.color;
						dcQuests = daily.thursday.quests;
						
						for(var i = 0; i < 4;){
							dcRewards[i] = clientDiscord.emojis.find("name", daily.thursday.rewards[i]);
							i++;
						}

						payloadStatus = "received";
					break;

					case 5:
						dcColor = daily.friday.color;
						dcQuests = daily.friday.quests;
						
						for(var i = 0; i < 4;){
							dcRewards[i] = clientDiscord.emojis.find("name", daily.friday.rewards[i]);
							i++;
						}

						payloadStatus = "received";
					break;

					case 6:
						dcColor = daily.saturday.color;
						dcQuests = daily.saturday.quests;
						
						for(var i = 0; i < 4;){
							dcRewards[i] = clientDiscord.emojis.find("name", daily.saturday.rewards[i]);
							i++;
						};
						payloadStatus = "received";			
					break;
				}
				
				// Sending out the payload
				if(dailyPartyAnnouncement == false){
					// default, normal payload
					message.channel.send({
						"embed":{
							"color": dcColor,
							"description": dcQuests
						}
					}).then(function(message){
						// Showing rewards as "reactions"
						for(var i = 0; i < 4;){
							message.react(dcRewards[i]);
							i++;
						};
					}).catch(console.error);
				}else{
					clientDiscord.guilds.map((guild) => {
						let found = 0;
						guild.channels.map((ch) =>{
							if(found == 0){
								if(ch.name == config.DEFAULT_PARTY_CHANNEL){
									ch.send("Daily challenges has been reset, today's challenges are: ",{
										"embed":{
											"color": dcColor,
											"description": dcQuests
										}
									}).then(function(message){
										// Showing rewards as "reactions"
										for(var i = 0; i < 4;){
											message.react(dcRewards[i]);
											i++;
										};
									}).catch(console.error);
									found = 1;
								}
							}
						});
					});
				};
				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message+" triggered, status: "+payloadStatus);
				payloadStatus = "rejected";
			break;

			// Koldrak's lair notification and closest time
			case 'koldrak':
				var koldrakDateVariable = new Date();
				var koldrakQuerry = message.toString().substring(1).split(' ');
					koldrakQuerry = koldrakQuerry.splice(1);

				switch(koldrakQuerry[0]){
					
					// Disabling the alert
					case 'disable':
						if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
							koldrakAlertSystem = false;
							console.log(" [ "+Date.now()+" ] > !koldrak alert is now disabled");
						}else{
							console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message+", status: rejected");
						};
					break;
					
					// Enabling the alert
					case 'enable':
						if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
							koldrakAlertSystem = true;
							console.log(" [ "+Date.now()+" ] > !koldrak alert is now enabled");
						}else{
							console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message+", status: rejected");
						};
					break;
					
					// Debug message when alert is disabled (delete for stable)
					case 'debug':
						clientDiscord.channels.find("name", "lab").send({
							"embed":{
								"color": 16753920, 
								"description": "!koldrak debug triggered"
							}
						});
						console.log(" [ "+Date.now()+" ] > it's now "+koldrakDateVariable.getUTCHours()+":"+koldrakDateVariable.getUTCMinutes()); // delete when fixed
					break;

					// Doing "Alert" at specific time(s)
					case 'alert':
						// Sending "Alert" to every "news" channel
						clientDiscord.guilds.map((guild) => {
							let found = 0;
							guild.channels.map((ch) =>{
								if(found == 0){
									if(ch.name == config.DEFAULT_PARTY_CHANNEL){
										ch.send({
											"embed":{
												"color": 8388736,
												"timestamp" : new Date(),
												"description": "**Koldrak's Lair** will be accessible in **10 Minutes**",
												"author":{
													"name": "Epic Challenge Alert",
												}
											}
										});
										found = 1;
									}
								}
							});
						});

						console.log(" [ "+Date.now()+" ] > !koldrak alert triggered");
					break;
					
					// Showing when is the closest Koldrak's lair time
					default:
						// Getting the hour of UTC+1
						var koldrakTimeHourNow = koldrakDateVariable.getUTCHours() + 1;
						var koldrakTimeMinutesNow = koldrakDateVariable.getUTCMinutes();

						// Cheating the search so it will still put hour even if the smallest time is 24
						var koldrakTimeLeft = 25;

						// Making new date data with details from above variable
						var koldrakTimeNow = new Date(0, 0, 0, koldrakTimeHourNow, koldrakTimeMinutesNow, 0);

						// Searching when is the closest one
						for(var i = 0; i < 5;){
							// Making new date data with details from koldrak's schedule (koldrak.json)
							var koldrakTimeNext = new Date(0, 0, 0, koldrakTime.time[i], 0, 0);
							// Getting the time difference
							var koldrakTimeDiff = koldrakTimeNext.getTime() - koldrakTimeNow.getTime();

							// Formatting
							var koldrakTimeHours = Math.floor(koldrakTimeDiff / 1000 / 60 / 60);

								koldrakTimeDiff -= koldrakTimeHours * 1000 * 60 * 60;
							
							var koldrakTimeMinutes = Math.floor(koldrakTimeDiff / 1000 / 60);

							// Making it 24 hours format
							if(koldrakTimeHours < 0){
								koldrakTimeHours = koldrakTimeHours + 24;
							}
							
							// UTC + 1 formatting
							koldrakTimeHours = koldrakTimeHours - 1;
							
							// Storing the closest for later
							if(koldrakTimeHours <= koldrakTimeLeft){
								if(koldrakTimeHours >= 0){
									koldrakTimeLeft = koldrakTimeHours;
								}
							}

							i++;
						}

						// Output
						message.channel.send("Closest **Koldrak's Lair** is accessible in **"+koldrakTimeLeft+" hour(s)** and **"+koldrakTimeMinutes+" minute(s)**");

						// Console Logging
						console.log(" [ "+Date.now()+" ] > "+message+" triggered");
				};
			break;

			case 'who':
				var whoQuerry = message.toString().substring(1).split('"');
					whoQuerry = whoQuerry.splice(1);
				
				var silveressCharacterData;
				
				var silveressQuerry = silveressNA+whoQuerry[0]; // for the querry
				var bnstreeProfile = "https://bnstree.com/character/na/"+whoQuerry[0]; // for author url so user can look at more detailed version
					bnstreeProfile = bnstreeProfile.replace(" ","%20"); // replacing the space so discord.js embed wont screaming error

				// fetching data from api site
				fetch(silveressQuerry)
					.then(res => res.json())
					.then(data => silveressCharacterData = data)
					.then(() => {
						message.channel.send({
							"embed": {
								"description": "\n**HP**: "+silveressCharacterData.hp+"\n**Attack Power**: "+silveressCharacterData.ap+"\n**Element**: "+silveressCharacterData.activeElement+"\n**Class**: "+silveressCharacterData.playerClass+"\n\n**Weapon**: "+silveressCharacterData.weaponName+"\n**Ring**: "+silveressCharacterData.ringName+"\n**Earring**: "+silveressCharacterData.earringName+"\n**Necklace**: "+silveressCharacterData.necklaceName+"\n**Bracelet**: "+silveressCharacterData.braceletName+"\n**Belt**: "+silveressCharacterData.beltName+"\n**Gloves**: "+silveressCharacterData.gloves+"\n**Soul**: "+silveressCharacterData.soulName+"\n**Pet**: "+silveressCharacterData.petAuraName+"\n**Soul Badge**: "+silveressCharacterData.soulBadgeName+"\n**Mystic Badge**: "+silveressCharacterData.mysticBadgeName+"\n\n**Server**: "+silveressCharacterData.server+"\n**Faction**: "+silveressCharacterData.faction+"\n**Guild**: "+silveressCharacterData.guild,
								"color": Math.floor(Math.random() * 16777215) - 0,
								"footer": {
									"icon_url": "https://slate.silveress.ie/images/logo.png",
									"text": "Powered by Silveress's BnS API"
								},
								"thumbnail": {
									"url": silveressCharacterData.characterImg
								},
								"author": {
									"name": silveressCharacterData.characterName+" - Lvl "+silveressCharacterData.playerLevel+" HM "+silveressCharacterData.playerLevelHM,
									"url": bnstreeProfile
														  
								}
							}
					  	})
					 	payloadStatus = 'recieved'
					})
					.then(() => payloadStatus = 'recieved')
					.catch(err => {
						console.log(err);
						payloadStatus = 'rejected';
					});
					
					console.log(" [ "+Date.now()+" ] > "+message+" triggered, status: "+payloadStatus);
					payloadStatus = "rejected";
			break;
         };
     };
});

// Bot token here
clientDiscord.login(secret.DISCORD_APP_TOKEN);

// Twitter hook
// Getting user tweet, parameter used: user id, e.g: "3521186773". You can get user id via http://gettwitterid.com/

clientTwitter.stream('statuses/filter', {follow: secret.TWITTER_STREAM_ID},  function(stream) {
	stream.on('data', function(tweet) {
		// Filtering data so it only getting data from specified user
		if((tweet.user.screen_name == secret.TWITTER_STREAM_SCREENNAME[0] || tweet.user.screen_name == secret.TWITTER_STREAM_SCREENNAME[1]) || (tweet.user.screen_name == secret.TWITTER_STREAM_SCREENNAME[2])){
			// Variable for filtering
			twtFilter = tweet.text.toString().substring(0).split(" ");

			// Filtering the "RT" and "mention" stuff
			if(twtFilter[0] == "RT" || twtFilter[0].charAt(0) == "@"){
				payloadStatus = "rejected";
			}else{		
				// Payload loading
				twtUsername = tweet.user.name.toString();
				twtScreenName = tweet.user.screen_name.toString();
				twtText = tweet.text.toString();
				twtAvatar = tweet.user.profile_image_url.toString();
				twtCreatedAt = tweet.created_at.toString();
				twtTimestamp = tweet.timestamp_ms.toString();

				payloadStatus = "received"

				// Making the color different for different user
				if(tweet.user.screen_name == secret.TWITTER_STREAM_SCREENNAME[0]){
					twtColor = 16753920;
				}else{
					twtColor = 1879160;
				};

				// Tringgering the !twcon so the bot will write a message with content from twitter (see "!twcon" for details)
				clientDiscord.emit("message", "!twcon");
			}
		}
		// Console logging
		console.log(" [ "+Date.now()+" ] > Tweet recived, status: "+payloadStatus);
		payloadStatus = "rejected";
	});
  
	stream.on('error', function(error) {
	  console.log(error);
	});
  });

  // Koldrak (Dragon) notification

  ontime({
		// Time format is on UTC
		cycle: ['00:50:00', '03:50:00', '06:50:00', '18:50:00', '21:50:00'], 
		utc: true
  }, function (koldrak){
		// Triggering "!koldrak alert" so the bot will write the alert (see "!koldrak" for details)
		if(koldrakAlertSystem == false){
			clientDiscord.emit("message", "!koldrak debug");
		}else{
			clientDiscord.emit("message", "!koldrak alert");
		};
		koldrak.done();
		return;
  }
) 

// Daily reset notification
ontime({
	cycle: ['12:00:00'],
	utc: true
	}, function(daily){
		clientDiscord.emit("message", "!daily announce");
		daily.done();
		return;
});

// Soyun activity changer
ontime({
    cycle: ['00']
}, function (soyunActivity) {
    	clientDiscord.emit("message", "!soyun status");
		soyunActivity.done();
		return;
})
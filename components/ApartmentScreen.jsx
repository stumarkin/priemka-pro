import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BannerView from './BannerView';
import { 
  Alert, 
  ScrollView, 
  StyleSheet,
  TextInput,
  View,
  Share
} from 'react-native';
import { Icon } from '@rneui/base'
import { 
  ListItem,
  ThemeProvider, 
  Text, 
  Button, 
  Dialog,
  CheckBox,
  Card,
  Divider,
  Skeleton
} from '@rneui/themed';
import { theme } from './theme';
import axios from 'axios';

const rand5digits = () => (Math.floor(Math.random()*100000));

const inclineWord = ( howMany, ofWhat, humanicStyle = false ) => {
  switch (ofWhat){
      case "недостаток":
          if ([11,12,13,14].includes(howMany)){
              return `${howMany} недостатков`;
          }
          switch ( howMany - (Math.floor(howMany/10)*10) ){
              case 1: return `${howMany} недостаток`
              case 2:
              case 3:
              case 4: return `${howMany} недостатка`
              case 0: if (humanicStyle) {return `пока не нашли недостатков`}
              default: return `${howMany} недостатков`
          }
      
      case "недостатка":
           switch ( howMany ){
              case 1: return `${howMany} недостатка`
              default: return `${howMany} недостатков`
          }
      
      case "проверка":
          if ([11,12,13,14].includes(howMany)){
              return `${howMany} проверок`;
          }
          switch ( howMany - (Math.floor(howMany/10)*10) ){
              case 1: return `${howMany} проверка`
              case 2:
              case 3:
              case 4: return `${howMany} проверки`
              default: return `${howMany} проверок`
          }
      default: return `${howMany} ${ofWhat}`
  }
}

export default function ApartmentScreen ({navigation, route}) {

   


    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [form, setForm] = useState({});
    const [isOverdue, setIsOverdue] = useState(false);
    const overdueAfterSeconds = 60 * 2;
    const [dictionary, setDictionary] = useState({});
    const isPro = route.params.isPro;
    const updateStoredForms = () => route.params.updateStoredForms();

    
    // const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
    // function forceUpdate () {
    //   setForceUpdateCounter( Math.random() );
    // }
    
    // Dialog Add Room
    const [checkedRoomId, setCheckedRoomId] = useState();
    const [roomsDialogIsVisible, setRoomsDialogIsVisible] = useState(false);
    const toggleRoomsDialogIsVisible = () => {
      setRoomsDialogIsVisible(!roomsDialogIsVisible);
    };
    
    const addSection = (sectionId, form, room) => {
      const section = JSON.parse(JSON.stringify( form.nested_templates.find( ({id}) => id == sectionId) ));
      section.templateId = section.id;
      section.id = '' + section.templateId + rand5digits();

      section.nested.push( ...form.nested_templates.filter( ({parent}) => parent == sectionId) );
      room.nested.push( JSON.parse(JSON.stringify(section)) );
      return room;
    }

    const addRoom = ( roomId, form, dictionary = dictionary ) => {
      let room =  JSON.parse(JSON.stringify( form.nested_templates.find( ({id}) => id==roomId) ));
      room.name = dictionary[roomId]?.name;
      room.templateId = room.id;
      room.id = '' + room.templateId + rand5digits();
      room.defaultNested.forEach( sectionId => {
        room = addSection(sectionId, form, room);
      });
      form.apartment.push( room );
      return form;
    }

    const onShare = async () => {
      try {
        const result = await Share.share({
          message: getFailChecks(form),
        });
        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            // shared with activity type of result.activityType
          } else {
            // shared
          }
        } else if (result.action === Share.dismissedAction) {
          // dismissed
        }
      } catch (error) {
        Alert.alert(error.message);
      }
    };

    const getName = ( obj ) => {
      return obj.name ? obj.name : dictionary[ (obj.templateId ? obj.templateId : obj.id) ].name;
    }
    

    // Initial loading
    useEffect(() => {
      axios.get(`https://priemka-pro.ru/api/v2/?method=getdictionary`)

      .then(res => {
        const dictionary = res.data ;
        setDictionary( dictionary );
        const url = `https://priemka-pro.ru/api/v2/?method=getform${route.params.formId ? `&id=${route.params.formId}` : '' }`
        console.log(url);
        
        axios.get(url)
        .then(res => {
            let form = res.data;
            setAddress(form.address);
            if (!route.params.formId) {
              form.timestampCreate = Date.now();
              ['room','kitchen','bathroom','corridor','general']. forEach( room => {
                form = addRoom(room, form, dictionary );
              })
            }
            setIsOverdue( isPro ? false : Math.floor((Date.now() - form.timestampCreate)/1000) > overdueAfterSeconds )
            setForm( form );
            setIsInitialLoading(false)
        })
      })
    }, []);


  
    // Sending to server
    const sendForm = ( ) => {
        setForm( form );
        let formData = new FormData();
        console.log( `Sending: ${form.id}` );
        formData.append('form', JSON.stringify( form ) );
        const apiURL = 'https://priemka-pro.ru/api/v2/?method=setform&token=' + form.token;
        setIsLoading(true);
        axios.post( 
            apiURL,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data'} }
        ).then(response => {
            AsyncStorage.setItem(`form_${form.id}`, JSON.stringify({
              address: form.address,
              checksCountTotal: form.apartment
                                .map( room => { 
                                  return room.nested
                                              .map( section => (section.nested.reduce( (sum, check) => (sum += 1), 0)) )
                                              .reduce( (sum, sectionChecksCount) => {
                                                return sum += sectionChecksCount
                                              }, 0 ) 
                                })
                                .reduce( (sum, roomChecksCountInAllSections) => { 
                                  return sum += roomChecksCountInAllSections
                                }, 0 ),
                failChecksCountTotal: form.apartment
                                      .map( room => { 
                                        return room.nested
                                                    .map( section => (section.nested.reduce( (sum, check) => (sum += check.value===false ? 1 : 0), 0)) )
                                                    .reduce( (sum, sectionChecksCount) => {
                                                      return sum += sectionChecksCount
                                                    }, 0 ) 
                                      })
                                      .reduce( (sum, roomChecksCountInAllSections) => { 
                                        return sum += roomChecksCountInAllSections
                                      }, 0 ),
            }));
            updateStoredForms();
            setIsLoading(false);
        })
        .catch( err => {
            console.log('SendForm failed: ' + err);
        });
    }

    const getFailChecks = ( form ) => {
      const failChecks = form?.apartment
        .map( (room) => (
          {
            ...room, 
            sections: room.nested.reduce( (sections, section ) => {
                        const checks = section.nested.reduce( (checks, check) => {
                          return checks += (!check.value ? `- ${getName(check)}\n` : '')
                        }, '' )
                        return sections += (checks!='' ? `${getName(section)}\n${checks}\n` : '')
                      }, '') 
          }
        ))
        .reduce( (sum, room) => ( sum += (room.sections!='' ? `${room.name.toUpperCase()}\n${room.sections}\n` : '') ), '' ) 
    
      return `В результате осмотра квартиры по адресу ${form.address} ` +
              `выявлены перечисленные ниже недостатки.\n`+
              `Акт осмотра: priemka-pro.ru/r/${form.id}\n\n`+
              `${failChecks}`;
    }


    const [address, setAddress] = useState('');
    const onEndEditingAddress = () => {
      if (address.length > 0){
        form.address = address; 
        sendForm()
      }
    }
  
    // S
    if (isInitialLoading){
      return (
        <View style={{ padding: 20 }}>
          <ThemeProvider theme={theme} >
            <Skeleton key={0} animation="pulse" height={50} />
            <Divider  key={1} width={10} style={{ opacity: 0 }} />
            <Skeleton key={2} animation="pulse" height={90} />
            <Divider  key={3} width={10} style={{ opacity: 0 }} />
            <Skeleton key={4} animation="pulse" height={90} />
            <Divider  key={5} width={10} style={{ opacity: 0 }} />
            <Skeleton key={6} animation="pulse" height={90} />
            <Divider  key={7} width={10} style={{ opacity: 0 }} />
            <Skeleton key={8} animation="pulse" height={90} />
            <Divider  key={9} width={10} style={{ opacity: 0 }} />
            <Skeleton key={10} animation="pulse" height={90} />
            <Divider  key={11} width={10} style={{ opacity: 0 }} />
            <Button color={theme.lightColors.grey5}>
              <Icon type='ionicon' name="add-circle-outline" color="white" /> Добавить комнату
            </Button>
          </ThemeProvider>
        </View>
      )
    }

    let checksCountTotal = 0;
    let failChecksCountTotal = 0;
    
    const apartmentRoomsUI = form.apartment ? form.apartment.map( room => {
        const checksCount = room.nested.reduce( (sum, section) => (sum + section.nested.reduce( (sectionSum, check) => ( sectionSum + 1), 0 )), 0);
        checksCountTotal += checksCount;
        
        const failChecksCount = room.nested.reduce( (sum, section) => (sum + section.nested.reduce( (sectionSum, check) => ( sectionSum + ( !check.value ? 1 : 0)), 0 )), 0);
        failChecksCountTotal += failChecksCount;

        return (
          <>
            <ListItem 
              key={room.id}
              onPress={
                () => { navigation.navigate('Room', { 
                  title: room.name,
                  dictionary,
                  form,
                  setForm,
                  sendForm,
                  room, 
                  roomId: room.id, 
                  isOverdue
                })}
              }
            >
                <ListItem.Content>
                    <ListItem.Title h3={true}>{room.name}</ListItem.Title>
                    <ListItem.Subtitle>{inclineWord(checksCount, "проверка")} и в них {inclineWord(failChecksCount, "недостаток")}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Chevron />
            </ListItem>
            <Divider width={10} style={{ opacity: 0 }} />
          </>

        )
    }) : ""


    return (
      <>
      { isLoading ? <Text style={{ backgroundColor: "#FEBE00", textAlign: "center", fontSize: 12, padding: 5 }}>Обновление данных</Text> : null }
      <ScrollView style={{ padding: 20}}>
        <ThemeProvider theme={theme} >
          
          <Divider width={10} style={{ opacity: 0 }} />

          <TextInput
            style={{
              height: 40,
              borderBottomColor: theme.lightColors.grey3,
              borderBottomWidth: 2,
              fontSize: 19,
              padding: 0,
            }}
            onChangeText={ setAddress }
            onEndEditing={ onEndEditingAddress }
            value={address}
            placeholder="Введите адрес квартиры"
            autoFocus={address==''}
          />
          <Divider width={10} style={{ opacity: 0 }} />
          
          
          
          <Button 
            onPress={
              onShare
            }
            disabled={failChecksCountTotal==0}
            buttonStyle={{backgroundColor: '#7E33B8'}}
          >
            {failChecksCountTotal == 0 ? 'Пока недостатков нет' : `Отправить список из ${inclineWord(failChecksCountTotal, "недостатка")}`}
          </Button>
          <Divider width={10} style={{ opacity: 0 }} />

          {
            failChecksCountTotal > 0 ?
              <View>
                <Button 
                  onPress={() =>{
                    navigation.navigate('Webview', {title: 'Акт осмотра', url: `https://priemka-pro.ru/r/${form.id}`, isSharable: true})
                  }}
                  disabled={failChecksCountTotal==0}
                  buttonStyle={{borderWidth: 1, borderColor: '#7E33B8' }}
                  titleStyle={{color: '#7E33B8'}}
                  type="outline"
                >
                  {failChecksCountTotal == 0 ? 'Пока недостатков нет' : `Акт осмотра`}
                </Button>
                <Divider width={10} style={{ opacity: 0 }} />
              </View>
            : null
          }

          {
            isOverdue > 0 ? (
              <BannerView 
                backgroundColor={theme.lightColors.warning}
                text="Эту приёмку больше нельзя менять, т.к. прошло более cуток с ее начала. Вы по прежнему можете получить отчёт по ней. На Pro тарифе этого ограничения нет."
            />
            ) : null
          }
         
          <Divider width={10} style={{ opacity: 0 }} />
          { apartmentRoomsUI }

          <Button 
            disabled={isOverdue}
            onPress={toggleRoomsDialogIsVisible}
          >
              <Icon type='ionicon' name="add-circle-outline" color="white" /> Добавить комнату
          </Button>
          <Divider width={10} style={{ opacity: 0 }} />
          <Text style={{fontSize:14, textAlign: 'center'}}>{`Всего ${inclineWord(checksCountTotal, "проверка")}\nи в них ${inclineWord(failChecksCountTotal, "недостаток", true)}`}</Text>
          <Divider width={10} style={{ opacity: 0 }} />
          <Text style={{textAlign: 'center', fontSize: 12}}>{form.id}</Text>
          <Divider width={10} style={{ opacity: 0 }} />

          <Dialog
            isVisible={roomsDialogIsVisible}
            onBackdropPress={toggleRoomsDialogIsVisible}
          >
            <Dialog.Title title="Какое помещение добавить?"/>
            {form?.nested_templates?.filter( item => (item.type=='room') ).map((item, i) => (
                <CheckBox
                  key={i}
                  title={dictionary[item.id].name}
                  containerStyle={{ backgroundColor: 'white', borderWidth: 0 }}
                  checkedIcon="dot-circle-o"
                  uncheckedIcon="circle-o"
                  checked={checkedRoomId === item.id}
                  onPress={() => setCheckedRoomId(item.id)}
                />
            ))}
            <Dialog.Actions>
                <Dialog.Button
                  title="Добавить"
                  onPress={() => {
                      setForm( addRoom(checkedRoomId, form, dictionary) );
                      sendForm(); 
                      toggleRoomsDialogIsVisible();
                  }}
                />
                <Dialog.Button title="Отмена" onPress={toggleRoomsDialogIsVisible} />
            </Dialog.Actions>
          </Dialog>
            
        </ThemeProvider>
      </ScrollView>
      </>
    )
    
  };

  const styles = StyleSheet.create({
    mb10: {
      marginBottom: 10,
    },
    ml10: {
      paddingLeft: 20,
    },
  });
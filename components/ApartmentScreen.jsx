import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {BannerIsOverdued, BannerView} from './BannerView';
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
  Badge,
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
import { init, track } from '@amplitude/analytics-react-native';



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

const getDeviceId = async () => {
  let deviceId = await SecureStore.getItemAsync('deviceId');
  if (!deviceId) {
      deviceId = generateId(19);
      await SecureStore.setItemAsync('deviceId', deviceId);
  }
  return deviceId;
}

export default function ApartmentScreen ({navigation, route}) {
    const [deviceId, setDeviceId] = useState(null)
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [form, setForm] = useState({});
    const [isOverdue, setIsOverdue] = useState(false);
    const overdueAfterSeconds = 60 * 60 *24;
    const [dictionary, setDictionary] = useState({});
    const ProDaysLeft = route.params.ProDaysLeft;
    const getPreviousForms = () => route.params.getPreviousForms();
    
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


    const getName = ( obj, useReportname = false ) => {
      return obj.name ? obj.name : ( useReportname ? dictionary[ (obj.templateId ? obj.templateId : obj.id) ].reportname : dictionary[ (obj.templateId ? obj.templateId : obj.id) ].name );
    }
    

    // Initial loading
    useEffect(() => {
      getDeviceId()
      .then( deviceId => { 
          setDeviceId(deviceId)
          init('c8698f1fccc72a1744388b9e1341b833', deviceId);
          track('ApartmentScreen-View'); 
      } )

      axios.get(`https://priemka-pro.ru/api/v2/?method=getdictionary`)
      .then(res => {
        const dictionary = res.data ;
        setDictionary( dictionary );
        const url = `https://priemka-pro.ru/api/v2/?method=getform${route.params.formId ? `&id=${route.params.formId}` : '' }`
        
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
            setIsOverdue( ProDaysLeft ? false : Math.floor((Date.now() - form.timestampCreate)/1000) > overdueAfterSeconds )
            setForm( form );
            setIsInitialLoading(false)
        })
      })
    }, []);


  
    // Sending form to server
    const sendForm = ( ) => {
        form.deviceid = deviceId;
        setForm(form);
        let formData = new FormData();
        const summary = {
            timestamp: Date.now(),
            address: form.address,
            checksCountTotal: form.apartment
                .map(room => {
                    return room.nested
                        .map(section => (section.nested.reduce((sum, check) => (sum += 1), 0)))
                        .reduce((sum, sectionChecksCount) => {
                            return sum += sectionChecksCount
                        }, 0)
                })
                .reduce((sum, roomChecksCountInAllSections) => {
                    return sum += roomChecksCountInAllSections
                }, 0),
            failChecksCountTotal: form.apartment
                .map(room => {
                    return room.nested
                        .map(section => (section.nested.reduce((sum, check) => (sum += check.value === false ? 1 : 0), 0)))
                        .reduce((sum, sectionChecksCount) => {
                            return sum += sectionChecksCount
                        }, 0)
                })
                .reduce((sum, roomChecksCountInAllSections) => {
                    return sum += roomChecksCountInAllSections
                }, 0),
        }
        formData.append('form', JSON.stringify(form));
        formData.append('summary', JSON.stringify(summary));
        const apiURL = 'https://priemka-pro.ru/api/v2/?method=setform&token=' + form.token;
        setIsLoading(true);
        axios.post(
            apiURL,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        ).then(response => {
            AsyncStorage.setItem(`form_${form.id}`, JSON.stringify(summary));
            getPreviousForms();
            setIsLoading(false);
        })
        .catch(err => {
            console.log('SendForm failed: ' + err);
        });
    }

    const getFailChecks = ( form, useReportname = false) => {
      const failChecks = form?.apartment
        .map( (room) => (
          {
            ...room, 
            sections: room.nested.reduce( (sections, section ) => {
                        const checks = section.nested.reduce( (checks, check) => {
                          return checks += (!check.value ? ` - ${getName(check, useReportname)}\n` : '')
                        }, '' )
                        return sections += (checks!='' ? `${getName(section)}:\n${checks}` : '')
                      }, '') +  (room.comment.length>0 ? `Другое:\n - ${room.comment.replace(/<br>/g, "\n - ") }\n` : '' )
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
      if (address.trim().length > 0){
        form.address = address.trim(); 
        sendForm()
      }
    }

    // Dialog Apartment Delete
    const [apartmentDeleteDialogIsVisible, setApartmentDeleteDialogIsVisible] = useState(false);
    const toggleApartmentDeleteDialogIsVisible = () => {
      setApartmentDeleteDialogIsVisible(!apartmentDeleteDialogIsVisible);
    };

    const deleteApartment = () => {
        if (form.id) {
            console.log(form.id);
            console.log(form.token);

            const apiURL = 'https://priemka-pro.ru/api/v2/?method=deleteform&id=' + form.id + '&token=' + form.token;
            axios.get( apiURL)
            .then( res=> {
                console.log(res.data);
                if (res.data.result){
                    AsyncStorage.removeItem(`form_${form.id}`)
                    getPreviousForms()
                    navigation.navigate('Home');
                } else {
                    console.log('Server deleteApartment failed: ' + res.data);
                }
            })
            .catch(err => {
                console.log('Server deleteApartment failed: ' + err);
            });
        }
    }

  
    // Skeletons
    if (isInitialLoading){
      return (
        <View style={{ padding: 20 }}>
          <ThemeProvider theme={theme} >
            <Skeleton key={0} animation="pulse" height={170} style={{borderRadius:10 }}/>
            <Divider  key={1} width={10} style={{ opacity: 0 }} />
            <Skeleton key={2} animation="pulse" height={400} style={{borderRadius:10 }}/>
            <Divider  key={3} width={10} style={{ opacity: 0 }} />
            <Skeleton key={4} animation="pulse" height={270} style={{borderRadius:10 }}/>
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
              containerStyle={{paddingHorizontal: 0, paddingVertical: 5}}

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
                    <ListItem.Title style={{fontWeight: 600}}>
                        {room.name} {failChecksCount ? <Badge value={failChecksCount} status="error"/> : ''} 
                    </ListItem.Title>
                    {
                        checksCount>0 ? (
                            <ListItem.Subtitle style={{color: 'grey'}}>{inclineWord(checksCount, "проверка")}</ListItem.Subtitle>
                        ): null
                    }
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
                
                { 
                    isOverdue ? (
                        <BannerIsOverdued/> 
                    ) : null
                }

                <BannerView 
                    key="address"
                    header="Адрес квартиры"
                    text="Используется в отчете и поможет найти квартиру среди других приёмок"
                    actionControls={
                        <TextInput
                            style={{
                                height: 40,
                                borderBottomColor: theme.lightColors.grey4,
                                borderBottomWidth: 2,
                                fontSize: 19,
                                padding: 0,
                                marginBottom: 10
                                }}
                            onChangeText={ setAddress }
                            onEndEditing={ onEndEditingAddress }
                            value={address}
                            placeholder="Введите адрес"
                        />
                    }
                />

                <BannerView 
                    key="rooms"
                    header="Комнаты и проверки"
                    actionControls={apartmentRoomsUI}
                    button={
                        <Button 
                            disabled={isOverdue}
                            onPress={()=>{
                                track('ApartmentScreen-AddRoom-Press');
                                toggleRoomsDialogIsVisible()
                            }}
                        >
                            <Icon type='ionicon' name="add-circle-outline" color='white' /> Добавить комнату
                        </Button>
                    }
                />

                <BannerView 
                    key="report"
                    header="Отчет"
                    text={`Всего ${inclineWord(checksCountTotal, "проверка")} и в них ${inclineWord(failChecksCountTotal, "недостаток", true)}`}
                    button={
                            <View style={{alignContent: 'space-between', flexDirection: 'row'}}>
                                <View style={{width:'50%'}}>    
                                    <Button
                                        key='list'
                                        onPress={() => {
                                            track('ApartmentScreen-List-Press', { failChecksCountTotal });
                                            navigation.navigate('FailChecksList', { title: 'Список', content: getFailChecks(form), contentWithReportnames: getFailChecks(form, true), ProDaysLeft })
                                        }}
                                        disabled={failChecksCountTotal == 0}
                                        buttonStyle={{ marginRight: 5, backgroundColor: '#7E33B8' }}
                                    >
                                        Список
                                    </Button>
                                </View>
                                <View style={{width:'50%'}}>    
                                    <Button
                                        key='blank'
                                        onPress={() => {
                                            track('ApartmentScreen-Blank-Press', { failChecksCountTotal });
                                            navigation.navigate('Webview', { title: 'Акт осмотра', url: `https://priemka-pro.ru/r/${form.id}`, isSharable: true })
                                        }}
                                        disabled={failChecksCountTotal == 0}
                                        buttonStyle={{ marginLeft: 5, borderWidth: 1, borderColor: '#7E33B8' }}
                                        titleStyle={{ color: '#7E33B8' }}
                                        type="outline"
                                    >
                                        Акт осмотра
                                    </Button>
                                </View>
                            </View>
                    }
                />

          
          <Divider width={10} style={{ opacity: 0 }} />

          {
            route.params.formId && ProDaysLeft ? (
                <Button 
                      title="Удалить квартиру"
                      type="clear"
                      titleStyle={{ color: "red"}}
                      onPress={toggleApartmentDeleteDialogIsVisible}
                  />
            ) : null
          }
          
          <Divider width={10} style={{ opacity: 0 }} />
         
          <Text style={{textAlign: 'center', fontSize: 12, color: 'lightgrey'}}>{form.id}</Text>

          <Divider width={20} style={{ opacity: 0 }} />

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
                  textStyle={{ fontSize: 16}}
                  checkedIcon={
                    <Icon
                        name="radio-button-on-outline"
                        type="ionicon"
                        size={18}
                    />
                  }
                  uncheckedIcon={
                    <Icon
                        name="radio-button-off-outline"
                        type="ionicon"
                        size={18}
                    />
                  }
                  checked={checkedRoomId === item.id}
                  onPress={() => setCheckedRoomId(item.id)}
                />
            ))}
            <Dialog.Actions>
                <Dialog.Button
                  title="Добавить"
                  onPress={() => {
                      track('ApartmentScreen-AddRoom-DialogRoomChoise-Press', { checkedRoomId });
                      setForm( addRoom(checkedRoomId, form, dictionary) );
                      sendForm(); 
                      toggleRoomsDialogIsVisible();
                  }}
                />
                <Dialog.Button title="Отмена" onPress={toggleRoomsDialogIsVisible} />
            </Dialog.Actions>
          </Dialog>

          <Dialog
                key='confirmDelete'
                isVisible={apartmentDeleteDialogIsVisible}
                onBackdropPress={toggleApartmentDeleteDialogIsVisible}
            >
                <Dialog.Title title="Точно удалить?"/>
                <Text>
                    Удалить квартиру и все выбранные для неё проверки и выявленные недостатки? Данное действие необратимо.
                </Text>
                <Dialog.Actions>
                    <Dialog.Button
                        title="Отменить"
                        onPress={toggleApartmentDeleteDialogIsVisible}
                    />
                    <Dialog.Button 
                        titleStyle={{color: "red"}}
                        title="Да, удалить" 
                        onPress={()=>{
                            deleteApartment(form)
                            alert('Квартира удалена успешно.')
                            getPreviousForms()
                            navigation.navigate('Home')
                        }} 
                    />
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
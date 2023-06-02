
import { useState, useEffect, useCallback } from 'react';
import { BannerView, BannerNeedUpdate } from './BannerView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { 
    Alert,
    View, 
    ScrollView, 
    Linking
} from 'react-native';
import { 
    ThemeProvider, 
    Text, 
    Button, 
    ListItem,
    Divider,
    Skeleton
} from '@rneui/themed';
import { theme } from './theme';
import * as API from '../data/API';
import * as SecureStore from 'expo-secure-store';

import { init, track } from '@amplitude/analytics-react-native';



const inclineWord = ( howMany, ofWhat, humanicStyle = false ) => {
    switch (ofWhat){
        case "недостаток":
            if ([11,12,13,14].includes(howMany)){
                return `${howMany} недостатков`;
            }
            switch ( howMany - (Math.floor(howMany/10)*10) ){
                case 0: if (humanicStyle) {return `пока не нашли недостатков`}
                case 1: return `${howMany} недостаток`
                case 2:
                case 3:
                case 4: return `${howMany} недостатка`
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

        case "приёмка":
            if ([11,12,13,14].includes(howMany)){
                return `${howMany} приёмок`;
            }
            switch ( howMany - (Math.floor(howMany/10)*10) ){
                case 1: return `${howMany} приёмка`
                case 2:
                case 3:
                case 4: return `${howMany} приёмки`
                default: return `${howMany} приёмок`
            }
        case "день":
            if ([11,12,13,14].includes(howMany)){
                return `${howMany} дней`;
            }
            switch ( howMany - (Math.floor(howMany/10)*10) ){
                case 1: return `${howMany} день`
                case 2:
                case 3:
                case 4: return `${howMany} дня`
                default: return `${howMany} дней`
            }
        case "минута":
            if ([11,12,13,14].includes(howMany)){
                return `${howMany} минут`;
            }
            switch ( howMany - (Math.floor(howMany/10)*10) ){
                case 1: return `${howMany} минута`
                case 2:
                case 3:
                case 4: return `${howMany} минуты`
                default: return `${howMany} минут`
            }
        case "час":
            if ([11,12,13,14].includes(howMany)){
                return `${howMany} часов`;
            }
            switch ( howMany - (Math.floor(howMany/10)*10) ){
                case 1: return `${howMany} час`
                case 2:
                case 3:
                case 4: return `${howMany} часа`
                default: return `${howMany} часов`
            }
        default: return `${howMany} ${ofWhat}`
    }
}

const  generateId = (length) => {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let i = 0;
    while (i < length) {
        i += 1;
        result += i%5 ? [...characters][Math.floor(Math.random() * characters.length)] : '-';
    }
    return result;
}

const getDeviceId = async () => {
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (!deviceId) {
        deviceId = generateId(19);
        await SecureStore.setItemAsync('deviceId', deviceId);
    }
    return deviceId;
}

const getTimeElapsed = ( timestamp ) => {
    const millis = Date.now() - timestamp;
    const secondsElapsed = Math.floor(millis / 1000);
    if (secondsElapsed<60) {
        return 'только что '
     } else  if (secondsElapsed<60*60) {
        return inclineWord(Math.floor(secondsElapsed/60), 'минута') + ' назад'
     } else  if (secondsElapsed<(60*60*24)) {
        return inclineWord(Math.floor(secondsElapsed/(60*60)), 'час') + ' назад'
     } else {
        return inclineWord(Math.floor(secondsElapsed/(60*60*24)), 'день') + ' назад'
     }
}



export default function HomeScreen ({navigation}) {
    // AsyncStorage.clear(); 
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [previousForms, setPreviousForms] = useState([]);
    const [banners, setBanners] = useState([]);
    const [deviceId, setDeviceId] = useState(null)
    const [ProDaysLeft, setProDaysLeft] = useState( false )
    const appVersion = '0.1'
    const [needUpdate, setNeedUpdate] = useState( false )
    const [counter, setCounter] = useState( 0 )

    const DESC = (a,b) => a - b;

    const getPreviousForms = () => {
        AsyncStorage.getAllKeys()
        .then( keys => {
            AsyncStorage.multiGet( keys.filter( key => key.indexOf('form') > -1) )
            .then( res => {
                setPreviousForms( res.sort((firstItem, secondItem) => JSON.parse(secondItem[1]).timestamp - JSON.parse(firstItem[1]).timestamp) )
            })
        })
    }



    // Initial
    useEffect(() => {
        getDeviceId()
        .then(deviceId =>{ 
            setDeviceId(deviceId)
            init('c8698f1fccc72a1744388b9e1341b833', deviceId);
            track('HomeScreen-View', {appVersion});
              
        } )
        
        API.Get('getbanners')
        .then(res => {
            if (res.data.result === true ){
                setBanners( res.data.banners );
            } else {
                console.log( 'Banner load fail. API response:\n' + res.data ) 
            }
        })
        
        API.Get('getcurrentversion')
        .then(res => {
            if (res.data.result === true ){
                setNeedUpdate( appVersion != res.data.currentversion );
            } else {
                console.log( 'Banner load fail. API response:\n' + res.data ) 
            }
        })

    }, []); 

    // isPro
    useEffect(()=>{
        if (deviceId) {
            API.Get({method:'prodaysleft',deviceid: deviceId})
            .then(res => {
                if (res.data.result){
                    setProDaysLeft( res.data.ProDaysLeft );
                } else {
                    console.log( 'isPro load fail. API response:\n' + res.data ) 
                }
                setIsInitialLoading(false)
            })
        }
    },[deviceId, counter]) 

    useFocusEffect(
        useCallback(() => {
            getPreviousForms()
        }, [])
      );
    


    // Banners with sections sorting
    const bannersUI = {}
    const bannerSections = banners.map(({section})=>(section)).filter( (item, i, arr) => arr.indexOf(item) === i );
    bannerSections.forEach( section_ => {bannersUI[section_] = banners.filter( ({section}) => section == section_ ).map( (banner, i) => (
        <BannerView {...banner} i  onPress={() =>{
            track('HomeScreen-Banner-Press', {banner: banner.header }); 
            navigation.navigate('Webview', {title: '', deviceid: deviceId, callback: ()=>{setCounter(counter+1)}, url: banner.webviewUrl + (banner.webviewUrl.indexOf('?')>-1 ? '&' : '?') + 'deviceid=' + deviceId })
         }}/>
    ))} )


    return (
        <ScrollView>
            <View style={{ padding: 20, paddingTop: 100}}>
                <ThemeProvider theme={theme}>
                    <View
                        style={{
                            justifyContent: 'space-between', 
                            flexDirection: 'row'
                        }}
                    >
                        <Text style={{fontSize: 36, fontWeight: 700, marginBottom: 20}}>Приёмка</Text>
                        
                        {
                            ProDaysLeft ? (
                                <Button 
                                    title={`Pro еще ${ProDaysLeft} дней 🚀`}
                                    containerStyle={{ }} 
                                    buttonStyle={{ 
                                        marginTop: 12,
                                        width: 140,
                                        backgroundColor: '#DDD',
                                        borderColor: 'transparent',
                                        borderWidth: 0,
                                        borderRadius: 5,
                                        padding: 4,
                                    }}
                                    titleStyle={{
                                        fontSize: 12,
                                        color: 'black'
                                    }}
                                    onPress={ ()=>navigation.navigate('Webview', {title: '', deviceid: deviceId, callback: ()=>{setCounter(counter+1)}, url: 'https://priemka-pro.ru/webview/pro/?deviceid=' + deviceId }) }
                                />
                            ) : null
                        }
                    </View>
                    
                    {
                        isInitialLoading ? (
                            <>
                                <Skeleton key={0} animation="pulse" height={150} style={{borderRadius: 10}}/>
                                <Divider  key={1} width={10} style={{ opacity: 0 }} />
                                <Skeleton key={2} animation="pulse" height={150} />
                                <Divider  key={3} width={10} style={{ opacity: 0 }} />
                                <Skeleton key={4} animation="pulse" height={370} />
                            </>
                        ) : (
                            <>
                                { 
                                    needUpdate ? (
                                        <BannerNeedUpdate track={track}/> 
                                    ) : null
                                }

                                { !ProDaysLeft ? bannersUI.top : bannersUI.pro}

                                <BannerView 
                                    i="new"
                                    header='Новая приёмка'
                                    text= { 
                                        !ProDaysLeft ? (
                                            5 - previousForms.length > 0 ? `Доступно еще ${inclineWord( 5 - previousForms.length, 'приёмка')}.\nНа Pro ограничений не будет.` : `Бесплатные приёмки закончились.\nНа Pro ограничений не будет.`
                                        ): 'Pro подключен. Вас не остановить!' 
                                    }
                                    button={ <Button
                                                title='Начать приёмку' 
                                                onPress={() =>{
                                                    if ( ProDaysLeft || previousForms.length<5 ){
                                                        track('HomeScreen-NewAcceptance-Press' );
                                                        navigation.navigate('Apartment', { getPreviousForms });
                                                    } else {
                                                        Alert.alert('Время переходить на Pro 🚀', '\nБесплатный тариф ограничен приёмкой 5 квартир.\nПереходите на Pro, в нем нет ограничений.')
                                                    }
                                                }}
                                            />
                                    }
                                />                
                                
                                <BannerView 
                                    i="prev"
                                    header='Предыдущие приёмки'
                                    text= { previousForms.length==0 ? 'Здесь появятся все ваши приемки. Указывайте адрес приёмки для удобного поиска в общем списке' : null }
                                    actionControls={
                                        previousForms.map( ([key, valueJSON]) => {
                                            const value = JSON.parse(valueJSON);
                                            return (
                                                    <ListItem 
                                                        key={key} 
                                                        containerStyle={{paddingHorizontal: 0}}
                                                        onPress={ () =>{ 
                                                            track('HomeScreen-PrevAcceptance-Press');
                                                            navigation.navigate('Apartment', {formId: key.split('_')[1], getPreviousForms, ProDaysLeft }) 
                                                        }}
                                                    >
                                                        <ListItem.Content>
                                                            <ListItem.Title style={{fontWeight: 600}}>{value.address ? value.address : 'Без адреса'}</ListItem.Title>
                                                            <ListItem.Subtitle style={{fontSize: 14}}>{inclineWord(value.failChecksCountTotal, "недостаток", true)}{ value.timestamp ? `, ${getTimeElapsed(value.timestamp)}` : null}</ListItem.Subtitle>
                                                        </ListItem.Content>
                                                        <ListItem.Chevron />
                                                    </ListItem>
                                            )
                                    })}
                                />                

                                {bannersUI.bottom}
                            </>
                        )
                    }
                    
                    {/* <Text style={{ textAlign: 'center', fontSize: 12, color: 'lightgrey'}}>{deviceId}</Text> */}
                    <StatusBar style="auto" />
                </ThemeProvider>
            </View>
        </ScrollView>
    );
  };
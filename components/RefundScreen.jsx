import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
    Alert,
    View, 
    ScrollView, 
    Pressable, 
    TextInput
} from 'react-native';
import { 
    ThemeProvider, 
    Text, 
    Button, 
    ListItem,
    Divider,
    Icon,
    CheckBox
} from '@rneui/themed';
import { theme } from './theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';


import { init, track } from '@amplitude/analytics-react-native';
init('c8698f1fccc72a1744388b9e1341b833', 'stumarkin@mail.ru');





const getDeviceId = async () => {
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (!deviceId) {
        deviceId = generateId(19);
        await SecureStore.setItemAsync('deviceId', deviceId);
    }
    return deviceId;
}

export default function RefundScreen ({navigation}) {
 
    const [deviceId, setDeviceId] = useState(null)
    const [square, setSquare] = useState('')
    const [designTypeSelected, setDesignTypeSelected] = useState(0)
    const designTypes = [
        {name: 'С чистовой отделкой', pricePerMetr: 10750},
        {name: 'White-box', pricePerMetr: 8750},
        {name: 'Без отделки', pricePerMetr: 6750},
    ]

    // Initial
    useEffect(() => {
        getDeviceId()
        .then(deviceId =>{ 
            setDeviceId(deviceId)
            track('RefundScreenView', { deviceId }); 
        } )
    }, []);  



    return (
        <ScrollView>
            <View style={{ padding: 20, paddingTop: 100}}>
                <ThemeProvider theme={theme}>
                    <Text style={{fontSize: 36, fontWeight: 700}}>Возмещение</Text>
                    <Text style={{ fontSize: 16 }}>Требования ко всем видам строительных работ описаны в СНиП. Несоответствие результата работ требованиям должно быть зафиксировано и оценено экспертизой, а с застрощика должно быть быть получено возмещение. В досудебном или судебном порядке.</Text>
                    


                    <Divider width={10} style={{ opacity: 0 }} />
                    
                    <View
                        style={{
                            backgroundColor: 'white', 
                            padding: 10,
                            borderRadius: 10,
                            overflow: 'hidden' 
                        }}
                    >
                       
                        <Text style={{fontSize: 22, fontWeight: 700, margin: 10}}>Расчёт суммы возмещения</Text>
                        <Text style={{ fontSize: 14, marginLeft: 10, marginBottom: 10 }}>Площадь квартиры:</Text>
                        <View style={[{
                            flexDirection: 'row',
                            flexWrap: 'wrap'
                        }]}
                        >               
                            <TextInput
                                style={{
                                    height: 40,
                                    borderBottomColor: theme.lightColors.grey3,
                                    borderBottomWidth: 2,
                                    fontSize: 28,
                                    padding: 2,
                                    marginLeft: 10,
                                    marginRight: 10,
                                    width: 55
                                }}
                                inputMode='numeric'
                                onChangeText={setSquare}
                                placeholder=""
                                value={square}
                            />
                            <Text style={{ fontSize: 22, marginTop: 10 }}>м²</Text>
                        </View>
                        
                        <View style={{ marginLeft: 0}}>
                            {designTypes.map((designType, i) => (
                                <CheckBox
                                    key={i}
                                    title={designType.name}
                                    checkedIcon="dot-circle-o"
                                    uncheckedIcon="circle-o"
                                    checked={designTypeSelected == i}
                                    onPress={() => setDesignTypeSelected(i)}
                                    containerStyle={{ 
                                        backgroundColor: 'white', 
                                        borderWidth: 0,
                                        marginBottom: 5,
                                        padding: 0
                                    }}
                                />
                            ))}
                        </View>
                        <Divider width={10} style={{ opacity: 0 }} />

                        <Button
                            title='Расcчитать' 
                            onPress={() =>{
                                if ( square!='' ){
                                    track('CalculateRefundPress', { deviceId });
                                    navigation.navigate('RefundCalculation', {title: '', square, designTypes, designTypeSelected});
                                } else {
                                    alert('Укажите площадь вашей квартиры для расчета суммы возмещения.')
                                }
                            }}
                        />
                    </View>
                    <Divider width={10} style={{ opacity: 0 }} />
                    

                    {/* <Text style={{ textAlign: 'center', fontSize: 12 }}>{deviceId}</Text> */}
                    <StatusBar style="auto" />
                </ThemeProvider>
            </View>
        </ScrollView>
    );
}
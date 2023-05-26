import { useState, useEffect } from 'react';
import BannerView from './BannerView';
import { 
    ScrollView, 
    StyleSheet, 
    TextInput,
    View
} from 'react-native';
import { 
    Badge,
    Button, 
    CheckBox,
    Dialog,
    Divider,
    Icon,
    ListItem,
    Switch,
    Text,
    ThemeProvider, 
} from '@rneui/themed';
import { theme } from './theme';
import * as Haptics from 'expo-haptics';


const rand5digits = () => (Math.floor(Math.random()*100000));

const inclineWord = ( howMany, ofWhat ) => {
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
    }
}


export default function RoomScreen ({navigation, route}) {
    const [isLoading, setIsLoading] = useState(true);
    const dictionary = route.params.dictionary;
    const isOverdue = route.params.isOverdue;
    let room = route.params.room;
    const form = route.params.form;
    const sendForm = (form) => route.params.sendForm(form);
    const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
    
    const forceUpdate = () => {
        setForceUpdateCounter(forceUpdateCounter+1);
    }

    // Dialog
    const [checkedSectionId, setCheckedSectionId] = useState();
    const [roomsDialogIsVisible, setRoomsDialogIsVisible] = useState(false);
    const toggleRoomsDialogIsVisible = () => {
      setRoomsDialogIsVisible(!roomsDialogIsVisible)
    };
    const addSection = (checkedSectionId, form, room) => {
        const section = JSON.parse(JSON.stringify( form.nested_templates.find( ({id}) => id == checkedSectionId) ));
        section.templateId = section.id;
        section.id = '' + section.templateId + rand5digits();

        section.nested.push( ...form.nested_templates.filter( ({parent}) => parent == checkedSectionId) );
        room.nested.push( JSON.parse(JSON.stringify(section)) );
        return room;
    }
    

    // Dialog Room Edit
    const [editRoomName, setEditRoomName] = useState('');
    const [roomEditDialogIsVisible, setRoomEditDialogIsVisible] = useState(false);
    const toggleRoomEditDialogIsVisible = () => {
      setRoomEditDialogIsVisible(!roomEditDialogIsVisible);
    };
    const onEndRoomEdit = () => {
        room.name = editRoomName;
        sendForm(form); 
        forceUpdate();
      }
    
    
    // Dialog Section Edit
    const [editSection, setEditSection] = useState('');
    const [editSectionName, setEditSectionName] = useState('');
    const [sectionEditDialogIsVisible, setSectionEditDialogIsVisible] = useState(false);
    const toggleSectionEditDialogIsVisible = () => {
      setSectionEditDialogIsVisible(!sectionEditDialogIsVisible);
    };
    const onEndSectionEdit = () => {
        editSection.name = editSectionName;
        sendForm(form); 
        forceUpdate();
    }
    const deleteSection = (section) => {
        room.nested = room.nested.filter( ({id}) => (id!=section.id) );
        sendForm(form); 
        forceUpdate();
    }
    
      
    // Dialog Room Delete
    const [roomDeleteDialogIsVisible, setRoomDeleteDialogIsVisible] = useState(false);
    const toggleRoomDeleteDialogIsVisible = () => {
      setRoomDeleteDialogIsVisible(!roomDeleteDialogIsVisible);
    };
    const deleteRoom = (room) => {
        form.apartment = form.apartment.filter( ({id}) => (id!=room.id) );
        sendForm(form); 
        forceUpdate();
    }
    

    // Dialog Check Details
    const [checkDetails, setCheckDetails] = useState({});
    const [checkDetailsDialogIsVisible, setCheckDetailsDialogIsVisible] = useState(false);
    const toggleCheckDetailsDialogIsVisible = () => {
        setCheckDetailsDialogIsVisible(!checkDetailsDialogIsVisible);
    }
    

    // Configure navbar title and button
    useEffect(() => {
        navigation.setOptions({
            title: room.name,
            headerRight: () => (
                !isOverdue ? (<Icon 
                    name="more-horizontal" 
                    type="feather" 
                    color={theme.lightColors.primary}
                    onPress={()=>{
                        setEditRoomName( room.name );
                        toggleRoomEditDialogIsVisible()
                    }}
                /> ) : null
            ),
        });
      }, [navigation, room.name]
    )
    
    
    // Expanding listitems
    const [expanded, setExpanded] = useState( 
        room.nested.reduce( (sum, {id}) => ({ ...sum, [id]: false }) , {} )
     );
    

    const roomSections = room.nested.map( section => {
        const sectionChecks = section.nested.map( check => {
            return (
                <ListItem 
                    onPress={ () => {
                        setCheckDetails(check)
                        toggleCheckDetailsDialogIsVisible()
                    }}
                    containerStyle={ check.value===false ? {backgroundColor: "#FFE4E1"} : {} }
                >
                    <ListItem.Content>
                        <ListItem.Title>&bull; {dictionary[check.id].name}</ListItem.Title>
                        <ListItem.Subtitle>{check.value}</ListItem.Subtitle>
                    </ListItem.Content>
                    
                    {
                        !isOverdue ? (
                            <Switch
                                value={!check.value}
                                onValueChange={ ()=>{
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                    check.value = !check.value;
                                    sendForm(form); 
                                    forceUpdate();
                                } }
                                color="#900603"
                                />
                        ) : null
                    }
                    
                </ListItem>
            )
        })

        const falseCheckCount = section.nested.reduce( (sum, cur) => ( sum + ( !cur.value ? 1 : 0) ), 0 );
        const badgeUI = falseCheckCount ? <Badge value={falseCheckCount} status="error"/> : '';
        return (
            <>
                <ListItem.Accordion
                    content={
                        <>
                            <ListItem.Content>
                                <ListItem.Title h4={true}>{section.name ? section.name : dictionary[section.templateId].name} {badgeUI}</ListItem.Title>
                                <ListItem.Subtitle>{inclineWord(section.nested.length, "проверка")} </ListItem.Subtitle>
                            </ListItem.Content>
                            {
                                !isOverdue ? (
                                    <Icon 
                                        name="more-horizontal" 
                                        type="feather" 
                                        color={theme.lightColors.grey4}
                                        onPress={()=>{
                                            setEditSection( section );
                                            setEditSectionName( section.name ? section.name : dictionary[section.templateId].name );
                                            toggleSectionEditDialogIsVisible()
                                        }}
                                    />
                                ) : null 
                                }
                        </>
                    }
                    isExpanded={expanded[section.id]}
                    onPress={() => {
                        setExpanded((expanded)=>({...expanded, [section.id]: !expanded[section.id]}));
                    }}
                >
                    {sectionChecks}
                </ListItem.Accordion>
                <Divider width={10} style={{ opacity: 0 }} />
            </>
        )
    })



    return (
      <ScrollView style={{ paddingTop: 20, paddingLeft: 20, paddingBottom: 50, paddingRight: 20}}>
        <ThemeProvider theme={theme} >

            {
                isOverdue > 0 ? (
                    <BannerView 
                        backgroundColor={theme.lightColors.warning}
                        text="Эту приёмку больше нельзя менять, т.к. прошло более cуток с ее начала. Вы по прежнему можете получить отчёт по ней. На Pro тарифе этого ограничения нет."
                    />
                ) : null
            }

            { roomSections }
            
            <Divider width={10} style={{ opacity: 0 }} />
            <Button 
                disabled={isOverdue}
                onPress={toggleRoomsDialogIsVisible}
            >
                <Icon type='ionicon' name="add-circle-outline" color="white" /> Добавить проверки
            </Button>
            <Divider width={40} style={{ opacity: 0 }} />
            
            <Dialog
                isVisible={roomsDialogIsVisible}
                onBackdropPress={toggleRoomsDialogIsVisible}
                >
                <Dialog.Title title="Что будем проверять в этой комнате?"/>
                <ScrollView style={{height: "70%"}}>
                    {form?.nested_templates.filter( item => (item.type=='section') ).map((section, i) => (
                        <CheckBox
                            key={i}
                            title={dictionary[section.id].name}
                            checkedIcon="dot-circle-o"
                            uncheckedIcon="circle-o"
                            checked={checkedSectionId === section.id}
                            onPress={() => setCheckedSectionId(section.id)}
                            containerStyle={{ 
                                backgroundColor: 'white', 
                                borderWidth: 0 
                            }}
                        />
                    ))}
                </ScrollView>
                <Dialog.Actions>
                    <Dialog.Button
                    title="Добавить"
                    onPress={() => {
                        room = addSection(checkedSectionId, form, room);
                        sendForm(form); 
                        toggleRoomsDialogIsVisible();
                    }}
                    />
                    <Dialog.Button title="Отмена" onPress={toggleRoomsDialogIsVisible} />
                </Dialog.Actions>
            </Dialog>

            <Dialog
                isVisible={roomEditDialogIsVisible}
                onBackdropPress={toggleRoomEditDialogIsVisible}
            >
                <Dialog.Title title="Название комнаты"/>
                <TextInput
                    style={{
                        height: 40,
                        backgroundColor: "#FFFFFF",
                        borderColor: "#AAA",
                        borderWidth: 1,
                        padding: 10,
                    }}
                    onChangeText={ setEditRoomName }
                    value={editRoomName}
                    placeholder="Введите название комнаты"
                />
                <Dialog.Actions>
                    <Dialog.Button
                        title="Сохранить"
                        onPress={() => {
                            onEndRoomEdit();
                            toggleRoomEditDialogIsVisible();
                        }}
                    />
                    <Dialog.Button 
                        titleStyle={{color: "red"}}
                        title="Удалить комнату" 
                        onPress={()=>{
                            toggleRoomEditDialogIsVisible(); 
                            toggleRoomDeleteDialogIsVisible(); 
                        }}
                    />
                </Dialog.Actions>
            </Dialog>
            
            
            <Dialog
                isVisible={sectionEditDialogIsVisible}
                onBackdropPress={toggleSectionEditDialogIsVisible}
            >
                <Dialog.Title title="Название проверок"/>
                <TextInput
                    style={{
                        height: 40,
                        backgroundColor: "#FFFFFF",
                        borderColor: "#AAA",
                        borderWidth: 1,
                        padding: 10,
                    }}
                    onChangeText={ setEditSectionName }
                    value={editSectionName}
                    placeholder="Введите название проверок"
                />
                <Dialog.Actions>
                    <Dialog.Button
                        title="Сохранить"
                        onPress={() => {
                            onEndSectionEdit();
                            toggleSectionEditDialogIsVisible();
                        }}
                    />
                    <Dialog.Button 
                        titleStyle={{color: "red"}}
                        title="Удалить проверки" 
                        onPress={()=>{
                            deleteSection(editSection);
                            toggleSectionEditDialogIsVisible(); 
                        }}
                    />
                </Dialog.Actions>
            </Dialog>


            <Dialog
                isVisible={roomDeleteDialogIsVisible}
                onBackdropPress={toggleRoomDeleteDialogIsVisible}
            >
                <Dialog.Title title="Точно удалить?"/>
                <Text>
                    Удалить комнату и все выбранные для неё проверки и выявленные недостатки? Данное действие необратимо.
                </Text>
                <Dialog.Actions>
                    <Dialog.Button
                        title="Отменить"
                        onPress={toggleRoomDeleteDialogIsVisible}
                    />
                    <Dialog.Button 
                        titleStyle={{color: "red"}}
                        title="Да, удалить" 
                        onPress={()=>{
                            deleteRoom(room);
                            navigation.navigate('Apartment')
                        }} 
                    />
                </Dialog.Actions>
            </Dialog>


            <Dialog
                isVisible={checkDetailsDialogIsVisible}
                onBackdropPress={toggleCheckDetailsDialogIsVisible}
            >
                <Dialog.Title title={dictionary[checkDetails.id]?.name}/>
                <Text>{dictionary[checkDetails.id]?.tint}</Text>
                <Divider/>
                {
                    !isOverdue ? (
                        <ListItem>
                            <ListItem.Content>
                                <ListItem.Title>Есть недостаток</ListItem.Title>
                            </ListItem.Content>
                            <Switch
                                value={!checkDetails.value}
                                onValueChange={ ()=>{
                                    checkDetails.value = !checkDetails.value;
                                    sendForm(form); 
                                    forceUpdate();
                                } }
                                color="#900603"
                                />
                        </ListItem>
                    ) : null
                }
            </Dialog>

        </ThemeProvider>
      </ScrollView>
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
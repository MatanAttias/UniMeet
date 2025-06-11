import { Alert, StyleSheet, Text, Touchable, View } from 'react-native'
import React from 'react'
import { hp } from '../constants/helpers/common'
import { theme } from '../constants/theme'
import Avatar from './Avatar'
import moment from 'moment'
import { TouchableOpacity } from 'react-native'
import Icon from '../assets/icons'

const CommentItem = ({
    item,
    canDelete = false,
    onDelete = ()=>{},
    highlight = false
}) => {
    const createdAt = moment(item?.created_at).format('D MMM')
        const handleDelete = () =>{
            Alert.alert('Confirm', "Are you sure you want to do this?", [
                {
                    text: 'Cancel',
                    onPress: ()=> console.log('modal cancelled'),
                    styles: 'cancel'
                },
                {
                    text: 'Delete',
                    onPress: ()=> onDelete(item),
                    style: 'destructive'
                }
            ])
        
    }
  return (
    <View style={styles.container}>
      <Avatar
        uri={item?.user?.image}
        />
        <View style={[styles.content, highlight && styles.highlight]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View style={styles.nameContainer}>
                    <Text style={styles.text}>
                        {
                            item?.user?.name
                        }
                    </Text>
                    <Text>*</Text>
                    <Text style={[styles.text, {color:theme.colors.textLight}]}>
                        {
                            createdAt
                        }
                    </Text>
                </View>
                {
                    canDelete && (
                        <TouchableOpacity onPress={handleDelete }>
                            <Icon name="delete" size={20} color={theme.colors.rose} />
                        </TouchableOpacity>
                    )
                }
                
            </View>   
            <Text style={[styles.text, {fontWeight: 'normal'}]}>
                {item?.text}    
            </Text> 
        </View>
    </View>
  )
}

export default CommentItem

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        gap: 7,
        
    },
    content: {
        backgroundColor: '#1a1a1a', // רקע כהה
        flex: 1,
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.radius.md,
        borderCurve: 'continuous',
        borderWidth: 1.5,
        borderColor: theme.colors.primary, // מסגרת בצבע ראשי
      },
      highlight: {
        backgroundColor: '#292929',
        borderColor: theme.colors.secondary,
        borderWidth: 2,
        shadowColor: theme.colors.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
      },
    
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    text: {
        fontSize: hp(1.6),
        fontWeight: theme.fonts.medium,
        color: theme.colors.textPrimary, // טקסט לבן/בהיר
      },   
})


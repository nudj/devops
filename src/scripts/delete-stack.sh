#!/bin/bash

function commonHelpMessage() {
  echo "Usage: $0 [-n stack-name][-h]" >&2
  echo "  stack-file : The CloudFormation template file" >&2
}


function parseCommonArguments() {
  if [ $# -eq 0 ];
  then
      commonHelpMessage
      exit 0
  fi

  while getopts ":s:h" opt; do
    case "$opt" in
      h)
        commonHelpMessage
        exit 0
        ;;
      s)
        echo "CloudFormation stack name $OPTARG";STACK_NAME="$OPTARG"
        ;;
      \?)
        echo "Invalid Option -$OPTARG" >&2
        commonHelpMessage
        exit 1
        ;;
      :)
        echo "Option -$OPTARG requires an argument" >&2
        exit 1
        ;;
      [?])
        commonHelpMessage
        exit 1
        ;;

    esac
  done

  if [ "$STACK_NAME" == "" ]; then
    echo "CloudFormation stack name parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi
}

parseCommonArguments "$@"

aws cloudformation describe-stacks --stack-name $STACK_NAME

# >/dev/null 2>&1

EXISTS=$?

if [ $EXISTS -eq 0 ]; then
  echo "Stack exists"
  echo "Deleting $STACK_NAME stack"
  aws cloudformation delete-stack --stack-name $STACK_NAME
  DELETING=$?
  if [ $DELETING -eq 0 ]; then
    echo "Performing stack delete"
  else
    echo "Delete of stack $STACK_NAME failed. Stopping!"
    exit 1
  fi
  aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$STACK_NAME failed to delete"
    exit 1
  else
    echo "$STACK_NAME deleted successfully"
  fi
else
  echo "Stack does not exist, nothing to delete"
fi
